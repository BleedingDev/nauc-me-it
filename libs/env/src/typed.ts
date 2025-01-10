import { Config, Effect } from 'effect'

const validateConfig = Config.all({
  BACKEND_PORT: Config.integer('BACKEND_PORT').pipe(Config.withDefault(3001)),
  BACKEND_URL: Config.url('BACKEND_URL').pipe(Config.withDefault(new URL('http://localhost:3001'))),
  FRONTEND_URL: Config.url('FRONTEND_URL').pipe(Config.withDefault(new URL('http://localhost:3000'))),
  ACCESS_TOKEN: Config.string('ACCESS_TOKEN'),
  PROJECT_ID: Config.string('PROJECT_ID'),
  SITE_URL: Config.url('SITE_URL'),
})

export const typedEnv = Effect.runSync(validateConfig)
