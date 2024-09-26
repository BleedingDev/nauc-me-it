import { Prisma, prisma } from '@nmit-coursition/db'
import { generateRandomIdentifier, isDateBeforeNow } from '@nmit-coursition/utils'
import { Elysia } from 'elysia'
import { formatApiErrorResponse, parseApiKey } from '../api'
import type { ApiErrorCode } from '../errorList'
import { ERROR_LIST } from '../errorList'
import { errorResponseModel } from '../model'
import type { ApiKeyReportUsageRequest, ApiUsageReport, ApiUsageRequest, ExtendedRequest } from '../typescript'

let API_KEY_TO_ID_CACHE: { [key: string]: bigint } = {}

export const apiCommonGuard = new Elysia().guard({
  as: 'scoped',
  response: {
    401: errorResponseModel,
    404: errorResponseModel,
    429: errorResponseModel,
    500: errorResponseModel,
  },
  beforeHandle: async ({ headers, request: r, error, set }) => {
    const request = r as ExtendedRequest
    request.requestId = generateRandomIdentifier()
    request.apiKey = String(headers['authorization'] || '')

    const errorCode: ApiErrorCode | undefined = await validateApiKey(request.apiKey)
    if (errorCode) {
      set.headers['Content-Type'] = 'application/json; charset=utf8'
      throw error(ERROR_LIST[errorCode].code, formatApiErrorResponse(request, errorCode))
    }
  },
})

export function reportUsage(apiKey: string, duration: number, type: 'video' | 'document' | 'web') {
  // eslint-disable-next-line no-console -- will be replaced with real usage reporting
  console.log(`API Key ${apiKey} used ${duration} on ${type}.`)
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

  const key = await prisma.cas__organisation_api_key.findFirst({
    select: { id: true, organisation_id: true, is_active: true, is_deleted: true, expiration_date: true },
    where: { api_key: apiKey },
  })
  if (!key) return 'PUBLIC_API_KEY_DOES_NOT_EXIST'
  if (key.is_deleted) return 'PUBLIC_API_KEY_HAS_BEEN_DELETED'
  if (!key.is_active) return 'PUBLIC_API_KEY_IS_NOT_ACTIVE'
  if (isDateBeforeNow(key.expiration_date)) return 'PUBLIC_API_KEY_HAS_BEEN_EXPIRED'
  API_KEY_TO_ID_CACHE[apiKey] = key.id

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

async function incrementKeyUsage(keyId: bigint) {
  await prisma.$executeRaw`
    UPDATE cas__organisation_api_key
    SET used_count_today = used_count_today + 1
    WHERE id = ${keyId}`
}
