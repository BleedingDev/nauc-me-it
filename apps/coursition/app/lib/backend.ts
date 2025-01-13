import { treaty } from '@elysiajs/eden'
import { publicConfig } from '@nmit-coursition/env'
import { Effect } from 'effect'
import type { App } from '../../../backend/src/index'

const typedPublic = Effect.runSync(publicConfig)
const backendUrl = typedPublic.BACKEND_URL.href || `http://localhost:${typedPublic.BACKEND_PORT}`
export const app = treaty<App>(backendUrl)
