import { AUTH_BRJ_COOKIES_NAME, AUTH_COOKIES_NAME, validateSessionToken } from '@nmit-coursition/auth'
import { Prisma, prisma } from '@nmit-coursition/db'
import { secretsEffect } from '@nmit-coursition/env'
import { generateRandomIdentifier, isDateBeforeNow } from '@nmit-coursition/utils'
import type { cas__user } from '@prisma/client'
import * as Sentry from '@sentry/bun'
import { Effect } from 'effect'
import { Elysia } from 'elysia'
import { formatApiErrorResponse, parseApiKey } from '../api'
import type { ApiErrorCode } from '../errorList'
import { ERROR_LIST } from '../errorList'
import { errorResponseModel, headersModel } from '../model'
import type {
  ApiKeyRecord,
  ApiKeyReportUsageRequest,
  ApiUsageReport,
  ApiUsageRequest,
  ExtendedRequest,
} from '../typescript'

const secretsEnv = await Effect.runPromise(secretsEffect)
let API_KEY_TO_ID_CACHE: { [key: string]: bigint } = {}

export const apiCommonGuard = new Elysia().guard({
  as: 'scoped',
  response: {
    401: errorResponseModel,
    402: errorResponseModel,
    404: errorResponseModel,
    422: errorResponseModel,
    429: errorResponseModel,
    500: errorResponseModel,
  },
  headers: headersModel,
  beforeHandle: async ({ headers, request: r, error, set, cookie }) => {
    const session = cookie[AUTH_COOKIES_NAME]?.toString() || ''
    const identityId = cookie[AUTH_BRJ_COOKIES_NAME]?.toString() || ''
    const apiKeyRaw = headers['authorization'] || ''
    const apiKey = apiKeyRaw || (await validateSessionToken(session, identityId))

    const request = r as ExtendedRequest
    request.requestId = generateRandomIdentifier()
    request.apiKey = apiKey
    initSentry(request)

    const errorCode: ApiErrorCode | undefined = await validateApiKey(apiKey)
    if (errorCode) {
      set.headers['Content-Type'] = 'application/json; charset=utf8'
      return error(ERROR_LIST[errorCode].code, formatApiErrorResponse(request, errorCode))
    }

    Sentry.setTag('authorizedKey', 'true')
    return
  },
})

function initSentry(request: ExtendedRequest) {
  Sentry.init({
    dsn: 'https://709a51d30d0a43d222def56984819928@o4508026955038720.ingest.de.sentry.io/4508047143010384',
    integrations: [Sentry.captureConsoleIntegration({ levels: ['error'] })],
    tracesSampleRate: 1,
    beforeSend(event, hint) {
      // @ts-ignore
      if (hint?.originalException?.message?.includes('Dynamic server usage')) {
        return null
      }
      return event
    },
  })

  Sentry.setTag('correlationId', request.requestId)
  Sentry.setTag('apiKey', request.apiKey?.replace(/^(\w{4}).*$/, '$1'))
  Sentry.setTag('authorizedKey', 'false')
  Sentry.setTag('url', request.url || 'CLI')
}

export async function reportUsage(identityId: string, duration: number, type: 'video' | 'document' | 'web') {
  const apiKey = secretsEnv.BRJ_API_KEY
  const amount = Math.ceil(duration)
  await fetch(`https://brj.app/api/v1/customer/credit-spend?apiKey=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      identityId,
      amount,
      description: type,
    }),
  })
}

export async function getLoggedUserOrThrow(request: Request): Promise<cas__user> {
  const key = String('apiKey' in request ? request.apiKey : '')
  if (!key) throw new Error(`User must be logged in.`)

  const userRecords = await prisma.$queryRaw<cas__user[]>`
    SELECT *
    FROM cas__user u
    WHERE u.id = (
        SELECT k.user_id
        FROM cas__organisation_api_key k
        WHERE k.api_key = ${key}
        LIMIT 1
    )
    LIMIT 1`

  if (userRecords[0]) return userRecords[0]

  throw new Error(`Invalid API key.`)
}

export async function reportSpend({
  request,
  apiKey,
  operationClass = 'A',
  spend = 1,
  metaData,
}: ApiKeyReportUsageRequest) {
  const key = apiKey || String('apiKey' in request ? request.apiKey : '')
  if (!key) return

  // eslint-disable-next-line no-console debug info
  console.log(`🚀 Spend report (${operationClass}): ${spend}`)

  await prisma.core__api_key_usage.create({
    data: {
      key_id: await resolveApiKeyIdByKey(key),
      operation_class: operationClass,
      spend: Number(spend),
      inserted_date: new Date(),
      ...(metaData ? { meta_data: metaData } : {}),
    },
  })
}

export async function validateApiKey(apiKey: string): Promise<ApiErrorCode | undefined> {
  if (!apiKey) return 'PUBLIC_API_KEY_DOES_NOT_EXIST'
  if (!parseApiKey(apiKey).isValid) return 'PUBLIC_API_KEY_IS_NOT_IN_VALID_FORMAT'

  const key = await selectApiKey(apiKey)
  if (!key) return 'PUBLIC_API_KEY_DOES_NOT_EXIST'
  if (key.is_deleted) return 'PUBLIC_API_KEY_HAS_BEEN_DELETED'
  if (!key.is_active) return 'PUBLIC_API_KEY_IS_NOT_ACTIVE'
  if (isDateBeforeNow(key.expiration_date)) return 'PUBLIC_API_KEY_HAS_BEEN_EXPIRED'
  API_KEY_TO_ID_CACHE[apiKey] = key.id

  Sentry.setUser({
    id: key.user_id || `key:${key.id}`,
    username: (key.full_name || '').trim() || undefined,
    email: key.email,
  })

  await incrementKeyUsage(key.id)
  return
}

export async function resolveApiKeyIdByKey(apiKey: keyof typeof API_KEY_TO_ID_CACHE): Promise<bigint> {
  const keyId: bigint | undefined = API_KEY_TO_ID_CACHE[apiKey]
  if (keyId) return keyId

  const selectedKey = await prisma.cas__organisation_api_key.findFirstOrThrow({
    select: { id: true },
    where: { api_key: String(apiKey) },
  })
  API_KEY_TO_ID_CACHE[apiKey] = selectedKey.id

  return selectedKey.id
}

export async function computeUsage(request: ApiUsageRequest): Promise<ApiUsageReport[]> {
  const keyIds = await resolveUsageKeyIds(request)
  const spendRaw = await prisma.$queryRaw<ApiUsageReport[]>`
   SELECT
     u.operation_class AS operation,
     SUM(u.spend) AS spend,
     COUNT(u.spend) AS operations
   FROM core__api_key_usage u
   WHERE u.key_id IN (${Prisma.join(keyIds)})
   GROUP BY u.operation_class`

  return spendRaw.map(
    (record): ApiUsageReport => ({
      operation: record.operation,
      spend: Number(record.spend),
      operations: Number(record.operations),
    }),
  )
}

async function resolveUsageKeyIds(request: ApiUsageRequest): Promise<bigint[]> {
  const where = {
    ...('apiKey' in request ? { api_key: request.apiKey } : {}),
    ...('userId' in request ? { user_id: request.userId } : {}),
    ...('organisationId' in request ? { organisation_id: request.organisationId } : {}),
  }
  if (Object.keys(where).length === 0) return []

  const keyListRaw = await prisma.cas__organisation_api_key.findMany({
    select: { id: true },
    where,
  })

  return keyListRaw.map((key) => key.id)
}

async function selectApiKey(apiKey: string): Promise<ApiKeyRecord | undefined> {
  const records = await prisma.$queryRaw<ApiKeyRecord[]>`
    SELECT
      k.id,
      k.organisation_id,
      k.is_active,
      k.is_deleted,
      k.expiration_date,
      u.workos_id AS user_id,
      u.first_name || ' ' || u.last_name AS full_name,
      u.email
    FROM cas__organisation_api_key k
    JOIN cas__user u ON u.id = k.user_id
    WHERE k.api_key = ${apiKey}
    LIMIT 1`

  return records?.[0]
}

async function incrementKeyUsage(keyId: bigint) {
  await prisma.$executeRaw`
    UPDATE cas__organisation_api_key
    SET used_count_today = used_count_today + 1
    WHERE id = ${keyId}`
}
