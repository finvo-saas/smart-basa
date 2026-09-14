import { absoluteUrl, siteConfig } from './site'

type Json = Record<string, unknown>

function absImage(url?: string | null) {
  if (!url) return undefined
  return url.startsWith('http') ? url : absoluteUrl(url)
}

export function organizationJsonLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl('/icons/icon-512.png'),
    description:
      'Find and manage mess, hostel, hotel, and apartment living in Bangladesh.',
    areaServed: {
      '@type': 'Country',
      name: 'Bangladesh',
    },
  }
}

export function websiteJsonLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: ['en-BD', 'bn-BD'],
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/search')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function faqPageJsonLd(
  items: Array<{ question: string; answer: string }>,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.slice(0, 20).map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function listingJsonLd(property: {
  name: string
  type: string
  rent: number
  area: string
  address: string
  city: string
  description: string
  images: string[]
  available: boolean
  path: string
  bedrooms?: number | null
  bathrooms?: number | null
}): Json {
  const image = absImage(property.images[0])
  return {
    '@context': 'https://schema.org',
    '@type': property.type === 'apartment' ? 'Apartment' : 'Accommodation',
    name: property.name,
    description: property.description.slice(0, 500),
    url: absoluteUrl(property.path),
    image: image ? [image] : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.area || property.city,
      addressRegion: property.city,
      addressCountry: 'BD',
    },
    numberOfRooms: property.bedrooms || undefined,
    numberOfBathroomsTotal: property.bathrooms || undefined,
    offers: {
      '@type': 'Offer',
      price: property.rent,
      priceCurrency: 'BDT',
      availability: property.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: absoluteUrl(property.path),
    },
  }
}

export function hotelJsonLd(hotel: {
  name: string
  description: string
  address: string
  area: string
  city: string
  images: string[]
  path: string
  starRating?: number
}): Json {
  const image = absImage(hotel.images[0])
  return {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    description: hotel.description.slice(0, 500),
    url: absoluteUrl(hotel.path),
    image: image ? [image] : undefined,
    starRating: hotel.starRating
      ? { '@type': 'Rating', ratingValue: hotel.starRating }
      : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: hotel.address,
      addressLocality: hotel.area || hotel.city,
      addressRegion: hotel.city,
      addressCountry: 'BD',
    },
  }
}

export function messJsonLd(mess: {
  name: string
  description?: string
  address: string
  city: string
  images?: string[]
  path: string
  monthlyFee: number
}): Json {
  const image = absImage(mess.images?.[0])
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: mess.name,
    description: (mess.description || `${mess.name} in ${mess.city}`).slice(0, 500),
    url: absoluteUrl(mess.path),
    image: image ? [image] : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: mess.address,
      addressLocality: mess.city,
      addressCountry: 'BD',
    },
    priceRange: `৳${mess.monthlyFee}`,
  }
}
