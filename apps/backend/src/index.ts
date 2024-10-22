import { swagger } from '@elysiajs/swagger'
import { apiAuth } from '@nmit-coursition/api/auth'
import { apiDev } from '@nmit-coursition/api/dev'
import { apiV1 } from '@nmit-coursition/api/v1'
import * as Sentry from '@sentry/bun'
import { Elysia } from 'elysia'
import { apiPayment } from '../../../libs/payments/src/api-payment'

new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Coursition API',
          version: '1.0.0',
          description:
            'Mix of API endpoints used to power Coursition and related apps. Also available as API for 3rd parties. Please contact me at syreanis@gmail.com for more information.',
        },
        tags: [
          {
            name: 'v1',
            description:
              "Stable endpoints in version 1 of API. Endpoints defined here won't be deleted, but might be marked as deprecated for following versions.",
          },
        ],
      },
    }),
  )
  .onError(({ error, code }) => {
    if (code === 'NOT_FOUND') return
    Sentry.captureException(error)
  })
  .use(apiAuth)
  .use(apiPayment)
  .use(apiV1)
  .use(apiDev)
  .listen(3000)
