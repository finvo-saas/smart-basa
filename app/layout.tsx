import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { AppAuthProvider } from '@/components/auth'
import { FeedbackProvider } from '@/components/feedback'
import { JsonLd } from '@/components/seo/JsonLd'
import { getPageMetadata } from '@/lib/seo/get-page-metadata'
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/json-ld'
import { siteConfig } from '@/lib/seo/site'
import '@/styles/globals.css'

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata('home')
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: siteConfig.themeColor },
    { media: '(prefers-color-scheme: dark)', color: '#042f2e' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Script id="pwa-install-capture" strategy="beforeInteractive">
          {`(function(){window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaInstallEvent=e;window.dispatchEvent(new Event('pwa-install-ready'));});})();`}
        </Script>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <FeedbackProvider>
              <AppAuthProvider>{children}</AppAuthProvider>
            </FeedbackProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
