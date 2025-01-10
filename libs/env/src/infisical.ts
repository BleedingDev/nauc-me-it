import { InfisicalSDK } from '@infisical/sdk'
import { parseError } from '@nmit-coursition/api/utils'
import { Data, Effect } from 'effect'
import { typedEnv } from './typed'

export class EmptyError extends Data.TaggedError('EmptyError')<{}> {}
export class FetchError extends Data.TaggedError('FetchError')<{ details: string }> {}
export class InfisicalError extends Data.TaggedError('InfisicalError')<{ details: string }> {}

export class InfisicalClient extends Effect.Service<InfisicalClient>()('env/InfisicalClient', {
  effect: Effect.gen(function* () {
    const {
      ACCESS_TOKEN,
      PROJECT_ID: projectId,
      SITE_URL: { href: siteUrl },
    } = typedEnv

    if (!ACCESS_TOKEN || !projectId) {
      yield* Effect.fail(new EmptyError())
    }

    const client = yield* Effect.tryPromise({
      try: async () => {
        const client = new InfisicalSDK({ siteUrl })
        await client.auth().accessToken(ACCESS_TOKEN)
        return client
      },
      catch: (e) => new InfisicalError({ details: parseError(e).message || 'Unknown error during fetching secrets' }),
    })

    const fetchSecrets = () =>
      Effect.tryPromise({
        try: () =>
          client.secrets().listSecrets({
            environment: 'dev',
            projectId,
          }),
        catch: (e) => new FetchError({ details: parseError(e).message || 'Unknown error during fetching secrets' }),
      })
    const getSecrets = () =>
      Effect.gen(function* () {
        const { secrets } = yield* fetchSecrets()
        return secrets
          .map((secret) => ({ [secret.secretKey]: secret.secretValue }))
          .reduce((acc, curr) => Object.assign(acc, curr), {})
      })

    return { getSecrets } as const
  }),
}) {}
