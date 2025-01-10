import { Config, ConfigProvider, Effect, Layer } from 'effect'
import { InfisicalClient } from './infisical'
import { redactedString, redactedUrl } from './utils'

class SecretsConfig extends Effect.Service<SecretsConfig>()('env/SecretsConfig', {
  effect: Effect.gen(function* () {
    const { getSecrets } = yield* InfisicalClient
    const secretsObj = yield* getSecrets()

    const jsonConfigProvider = ConfigProvider.fromJson(secretsObj)
    const jsonConfigLayer = Layer.setConfigProvider(jsonConfigProvider)

    const config = yield* Config.all({
      BRJ_API_KEY: redactedString('BRJ_API_KEY'),
      DATABASE_URL: redactedUrl('DATABASE_URL'),
      DEEPGRAM_API_KEY: redactedString('DEEPGRAM_API_KEY'),
      DIRECT_URL: redactedUrl('DIRECT_URL'),
      FIRECRAWL_API_KEY: redactedString('FIRECRAWL_API_KEY'),
      GOOGLE_ID: redactedString('GOOGLE_ID'),
      GOOGLE_SECRET: redactedString('GOOGLE_SECRET'),
      LLAMA_CLOUD_API_KEY: redactedString('LLAMA_CLOUD_API_KEY'),
      OPENAI_API_KEY: redactedString('OPENAI_API_KEY'),
      RESEND_API_KEY: redactedString('RESEND_API_KEY'),
      WORKOS_API_KEY: redactedString('WORKOS_API_KEY'),
      WORKOS_CLIENT_ID: redactedString('WORKOS_CLIENT_ID'),
      WORKOS_COOKIE_PASSWORD: redactedString('WORKOS_COOKIE_PASSWORD'),
    }).pipe(Effect.provide(jsonConfigLayer))

    return config
  }),
  dependencies: [InfisicalClient.Default],
}) {}

const program = Effect.gen(function* (_) {
  const config = yield* SecretsConfig
  return config
})

const secretsEffect = program.pipe(
  Effect.provide(SecretsConfig.Default),
  Effect.catchTag('EmptyError', () => Effect.die(`Empty PROJECT_ID or ACCESS_TOKEN.`)),
  Effect.catchTag('FetchError', (error) => Effect.die(`Fetching secrets failed. Details: ${error.details}`)),
  Effect.catchTag('InfisicalError', (error) =>
    Effect.die(`Initialization of Infisical failed. Details: ${error.details}`),
  ),
)

type Secrets = Effect.Effect.Success<typeof secretsEffect>

export let secretsEnv: Secrets = await Effect.runPromise(secretsEffect)
