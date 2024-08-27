import '@nmit-coursition/ui/utils/global.css'
import { getServerSession } from 'next-auth'
import { Toaster } from 'sonner'
import Script from 'next/script'
import { SessionProvider } from '../components/session-provider'

export const metadata = {
  title: 'Welcome to nmit',
  description: 'Generated by create-nx-workspace',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()

  return (
    <html lang='en'>
      <Script src='https://app.lemonsqueezy.com/js/lemon.js' strategy='lazyOnload' />
      <SessionProvider session={session}>
        <body className='overflow-hidden'>
          <Toaster />
          {children}
        </body>
      </SessionProvider>
    </html>
  )
}
