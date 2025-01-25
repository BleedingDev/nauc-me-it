import { prisma } from '@nmit-coursition/db'
import { secretsEffect } from '@nmit-coursition/env'
import { Effect } from 'effect'
import type { User } from './typescript'

const secretsEnv = await Effect.runPromise(secretsEffect)

export async function validateSessionToken(sessionToken: string, identityId: string): Promise<string> {
  if (!sessionToken) return ''
  const userIdentityRecord = await prisma.cas__user_identity.findFirst({
    select: { user_id: true },
    where: { session: sessionToken, expired: false, expiration_date: { gte: new Date() } },
  })
  if (!userIdentityRecord) return ''

  const apiKeyRecord = await prisma.cas__organisation_api_key.findFirst({
    select: { api_key: true },
    where: { user_id: userIdentityRecord.user_id },
  })

  return apiKeyRecord?.api_key || (await createApiKey(identityId))
}

export async function createApiKey(identityId: string): Promise<string> {
  const request = await fetch(`https://brj.app/api/v1/customer/create-api-key?apiKey=${secretsEnv.BRJ_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identityId,
      // TODO: description: '',
      // TODO: workspaceCode: undefined,
    }),
  })

  const response = (await request.json()) as { apiKey: string; expirationDate: string }

  const apiKey = response.apiKey || ''
  await prisma.cas__organisation_api_key.create({
    data: {
      organisation_id: 1, // TODO
      api_key: apiKey,
      used_count_today: 0,
      user_id: 1, // TODO
      is_active: true,
      is_deleted: false,
      description: 'API key',
      inserted_date: new Date(),
      expiration_date: new Date(response.expirationDate),
      last_used_date: new Date(),
    },
  })

  return apiKey
}

export async function createBrjMagicAuth(userData: User): Promise<string> {
  const request = await fetch(`https://brj.app/api/v1/customer/magic-auth?apiKey=${secretsEnv.BRJ_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: secretsEnv.BRJ_API_KEY,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
    }),
  })

  const response = (await request.json()) as { identityId?: string }
  if ('identityId' in response && response.identityId) return String(response.identityId)
  throw new Error(`User registration failed.`)
}

export async function logoutBrj(session: string) {
  const res = await fetch(`https://brj.app/api/v1/customer/logout?apiKey=${secretsEnv.BRJ_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey: secretsEnv.BRJ_API_KEY, identityId: session }),
  })
  console.log(res)
}

export async function getBrjIdentity(session: string) {
  const res = await fetch(
    `https://brj.app/api/v1/customer/get-account-info?apiKey=${secretsEnv.BRJ_API_KEY}&identityId=${session}`,
  )
  return res.json()
}

export async function invalidateSession(session: string) {
  await prisma.cas__user_identity.updateMany({
    where: { session },
    data: { expired: true },
  })
}
