import type { Metadata } from 'next'
import type { AppLocale } from '@/lib/i18n/config'
import { getLocaleCode } from '@/lib/i18n/config'
import { absoluteUrl, siteConfig } from './site'

export type BuildMetadataInput = {
  title: string
  description: string
  path?: string
  locale?: AppLocale
  noindex?: boolean
  keywords?: string[]
  images?: Array<{ url: string; alt?: string; width?: number; height?: number }>
}

export function buildMetadata({
  title,
  description,
  path = '/',
  locale = 'en',
  noindex = false,
  keywords = [],
  images,
}: BuildMetadataInput): Metadata {
  const canonical = absoluteUrl(path)
  const ogLocale = getLocaleCode(locale)
  const fullTitle = title.includes(siteConfig.name)
    ? title
    : `${title} | ${siteConfig.name}`

  const ogImages =
    images && images.length > 0
      ? images.map(img => ({
          url: img.url.startsWith('http') ? img.url : absoluteUrl(img.url),
          alt: img.alt ?? title,
          width: img.width ?? 1200,
          height: img.height ?? 630,
        }))
      : [
          {
            url: absoluteUrl(siteConfig.defaultOgImage),
            alt: siteConfig.name,
            width: 1200,
            height: 630,
          },
        ]

  return {
    metadataBase: new URL(siteConfig.url),
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical,
    },
    robots: noindex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
        },
    openGraph: {
      type: 'website',
      locale: ogLocale.replace('-', '_'),
      url: canonical,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.twitterHandle,
      title: fullTitle,
      description,
      images: ogImages.map(i => i.url),
    },
    other: {
      'apple-mobile-web-app-capable': 'yes',
      'mobile-web-app-capable': 'yes',
    },
    icons: {
      icon: [
        { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
    },
    appleWebApp: {
      capable: true,
      title: siteConfig.shortName,
      statusBarStyle: 'default',
    },
  }
}
