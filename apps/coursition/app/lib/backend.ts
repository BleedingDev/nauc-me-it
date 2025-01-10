import { treaty } from '@elysiajs/eden'
import { typedEnv } from '@nmit-coursition/env'
import type { App } from '../../../backend/src/index'

const backendUrl = typedEnv.BACKEND_URL.href || `http://localhost:${typedEnv.BACKEND_PORT}`
export const app = treaty<App>(backendUrl)
