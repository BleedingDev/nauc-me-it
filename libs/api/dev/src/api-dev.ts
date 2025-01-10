import { apiCommonGuard, computeUsage, reportSpend } from '@nmit-coursition/api/utils'
import { Elysia } from 'elysia'

export const apiDev = new Elysia({ prefix: '/dev', tags: ['dev'] })
  .use(apiCommonGuard)
  .get('/ping', () => ({ status: 'ZEROPS' }), {
    afterResponse: ({ request }) => reportSpend({ request }),
  })
  .get('/fail', () => {
    throw new Error(
      `This is error message from always failing endpoint. Current server time: ${new Date().toISOString()}`,
    )
  })
  .get('/report-usage', async () => await computeUsage({ organisationId: 1 }), {
    afterResponse: ({ request }) => reportSpend({ request }),
  })
