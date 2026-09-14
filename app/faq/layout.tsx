import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { createPageMetadata } from '@/lib/seo/segment-layout'
import { JsonLd } from '@/components/seo/JsonLd'
import { faqPageJsonLd } from '@/lib/seo/json-ld'
import { faqItems as faqEn } from '@/data/legalContent/en'
import { faqItems as faqBn } from '@/data/legalContent/bn'

export const generateMetadata: () => Promise<Metadata> =
  createPageMetadata('faq')

export default async function FaqLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const items = locale === 'bn' ? faqBn : faqEn
  return (
    <>
      <JsonLd data={faqPageJsonLd(items)} />
      {children}
    </>
  )
}
