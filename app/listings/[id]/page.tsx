import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import {
  getListingMetadata,
  getListingNotFoundMetadata,
} from '@/lib/seo/get-page-metadata'
import { fetchPropertyServer } from '@/lib/seo/fetch-entity'
import { extractEntityId, listingPath } from '@/lib/seo/slug'
import { breadcrumbJsonLd, listingJsonLd } from '@/lib/seo/json-ld'
import { JsonLd } from '@/components/seo/JsonLd'
import { ListingDetailClient } from './ListingDetailClient'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: param } = await params
  const property = await fetchPropertyServer(extractEntityId(param))
  if (!property) return getListingNotFoundMetadata()
  return getListingMetadata(property)
}

export default async function ListingPage({ params }: Props) {
  const { id: param } = await params
  const id = extractEntityId(param)
  const property = await fetchPropertyServer(id)

  // Canonicalize when we have data. Do not hard-404 on API blips —
  // client page can still load via the browser proxy.
  if (property) {
    const canonical = listingPath(property)
    if (canonical !== `/listings/${param}`) permanentRedirect(canonical)
  }

  const canonical = property ? listingPath(property) : `/listings/${param}`

  return (
    <>
      {property ? (
        <JsonLd
          data={[
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Search', path: '/search' },
              { name: property.name, path: canonical },
            ]),
            listingJsonLd({
              name: property.name,
              type: property.type,
              rent: property.rent,
              area: property.area,
              address: property.address,
              city: property.city,
              description: property.description,
              images: property.images,
              available: property.available,
              path: canonical,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
            }),
          ]}
        />
      ) : null}
      <ListingDetailClient id={id} />
    </>
  )
}
