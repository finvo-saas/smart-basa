import { fetchSitemapEntities, type SitemapEntity } from './fetch-entity'
import { hotelPath, listingPath, messPath } from './slug'
import { absoluteUrl } from './site'

/** Paths that should be indexed and appear in the sitemap. */
export const publicIndexablePaths = [
  '/',
  '/search',
  '/properties',
  '/hotels',
  '/compare',
  '/university',
  '/areas',
  '/roommates',
  '/areas/compare',
  '/terms',
  '/privacy',
  '/safety',
  '/faq',
  '/help',
  '/about',
  '/contact',
] as const

/** Auth / account flows — reachable but not indexed. */
export const publicNoIndexPaths = [
  '/login',
  '/otp-verify',
  '/role-selection',
  '/account/recover',
  '/account/change-phone',
  '/set-pin',
] as const

/** Prefixes blocked in robots.txt and tagged noindex via middleware. */
export const privatePathPrefixes = [
  '/dashboard',
  '/admin',
  '/profile',
  '/bills',
  '/payments',
  '/mess',
  '/notifications',
  '/complaints',
  '/notices',
  '/messages',
  '/documents',
  '/reminders',
  '/expenses',
  '/reports',
  '/rentals',
  '/subscription',
  '/favorites',
  '/saved-searches',
  '/search-history',
  '/my-hotels',
  '/my-properties',
  '/my-listings',
  '/my-bookings',
] as const

export function isPrivatePath(pathname: string): boolean {
  return privatePathPrefixes.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isPublicNoIndexPath(pathname: string): boolean {
  return publicNoIndexPaths.some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  )
}

export function shouldNoIndex(pathname: string): boolean {
  return isPrivatePath(pathname) || isPublicNoIndexPath(pathname)
}

type SitemapEntry = {
  url: string
  lastModified?: Date
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  priority?: number
}

function lastModified(entity: SitemapEntity, fallback: Date): Date {
  if (!entity.updatedAt) return fallback
  const parsed = new Date(entity.updatedAt)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function entityEntries(
  entities: SitemapEntity[],
  toPath: (entity: SitemapEntity) => string,
  priority: number,
  fallback: Date
): SitemapEntry[] {
  return entities.map(entity => ({
    url: absoluteUrl(toPath(entity)),
    lastModified: lastModified(entity, fallback),
    changeFrequency: 'weekly' as const,
    priority,
  }))
}

/** Static pages plus every public listing, hotel and mess from the API. */
export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const now = new Date()
  const staticEntries: SitemapEntry[] = publicIndexablePaths.map(path => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === '/' ? ('daily' as const) : ('weekly' as const),
    priority: path === '/' ? 1 : path === '/search' ? 0.9 : 0.7,
  }))

  const { listings, hotels, messes } = await fetchSitemapEntities()

  return [
    ...staticEntries,
    ...entityEntries(listings, listingPath, 0.8, now),
    ...entityEntries(hotels, hotelPath, 0.75, now),
    ...entityEntries(messes, messPath, 0.75, now),
  ]
}
