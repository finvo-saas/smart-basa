import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { buildMetadata } from '@/lib/seo/build-metadata'
import type { AppLocale } from '@/lib/i18n/config'
import { fetchMessServer } from '@/lib/seo/fetch-entity'
import { extractEntityId, messPath } from '@/lib/seo/slug'
import { breadcrumbJsonLd, messJsonLd } from '@/lib/seo/json-ld'
import { JsonLd } from '@/components/seo/JsonLd'
import { MessDetailClient } from './MessDetailClient'

type Props = { params: Promise<{ messId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { messId } = await params
  const mess = await fetchMessServer(extractEntityId(messId))
  const locale = (await getLocale()) as AppLocale

  if (!mess) {
    return buildMetadata({
      title: 'Mess',
      description: 'Mess and hostel details on SmartBasa.',
      path: `/messes/${messId}`,
      locale,
      noindex: true,
    })
  }

  const seats =
    mess.availableSeats > 0
      ? `${mess.availableSeats} seats available`
      : 'No seats available right now'

  return buildMetadata({
    title: `${mess.name} — ${mess.city}`,
    description: (
      mess.description ||
      `${seats}. Monthly fee from ৳${mess.monthlyFee} at ${mess.address}, ${mess.city}.`
    ).slice(0, 160),
    path: messPath(mess),
    locale,
    keywords: [
      'mess',
      'hostel',
      mess.city,
      mess.gender === 'mixed' ? 'co-ed mess' : `${mess.gender} mess`,
      'Bangladesh',
    ],
    images: mess.images?.[0]
      ? [{ url: mess.images[0], alt: mess.name }]
      : undefined,
  })
}

export default async function PublicMessDetailPage({ params }: Props) {
  const { messId: param } = await params
  const mess = await fetchMessServer(extractEntityId(param))

  // Send `/messes/<uuid>` and stale slugs to the canonical keyword URL.
  if (mess) {
    const canonical = messPath(mess)
    if (canonical !== `/messes/${param}`) permanentRedirect(canonical)
  }

  const canonical = mess ? messPath(mess) : `/messes/${param}`

  return (
    <>
      {mess ? (
        <JsonLd
          data={[
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Search', path: '/search' },
              { name: mess.name, path: canonical },
            ]),
            messJsonLd({
              name: mess.name,
              description: mess.description,
              address: mess.address,
              city: mess.city,
              images: mess.images,
              path: canonical,
              monthlyFee: mess.monthlyFee,
            }),
          ]}
        />
      ) : null}
      <MessDetailClient />
    </>
  )
}
