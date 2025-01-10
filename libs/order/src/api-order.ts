import { apiCommonGuard } from '@nmit-coursition/api/utils'
import { secretsEnv, typedEnv } from '@nmit-coursition/env'
import { Elysia } from 'elysia'

export const apiOrder = new Elysia({ prefix: '/order' }).use(apiCommonGuard).post('/credit-order', async () => {
  const response = await fetch(`https://brj.app/api/v1/shop/order/create?apiKey=${secretsEnv.BRJ_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: secretsEnv.BRJ_API_KEY,
      customer: { email: 'syreanis@gmail.com' },
      locale: 'cs',
      currency: 'CZK',
      publicNotice: 'Poznámka zákazníka',
      internalNotice: 'Nabití kreditů',
      items: [
        {
          label: 'Nabití kreditů',
          price: 300,
          count: 1,
          vat: 0,
          creditAmount: 500,
        },
      ],
      // Tam budu přesměrován po úspěšném dokončení platby (děkovací stránky)
      returnUrl: typedEnv.FRONTEND_URL.href,
    }),
  })
  // Vždy přesměřovat na response.redirectUrl
  return { status: 'CREDITS', response: await response.json() }
})
