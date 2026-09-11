import type { Hotel } from '@/types/hotel'
import type { Mess } from '@/types/mess'
import type { Property } from '@/types/property'

const DEFAULT_API_BASE = 'http://127.0.0.1:8000/api/v1'

/** Absolute API base for Node SSR / middleware (relative `/api/v1` is browser-only). */
function apiBase(): string {
  const internal = process.env.API_INTERNAL_URL?.trim()
  if (internal) return internal.replace(/\/$/, '')
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()
  // Relative browser path is not valid for Node fetch — hit Django directly.
  if (raw && !raw.startsWith('/')) return raw.replace(/\/$/, '')
  return DEFAULT_API_BASE
}

/**
 * Server-side read of a public entity for metadata and canonical redirects.
 * Returns null when the API is unreachable so builds don't fail.
 */
async function fetchEntity<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase()}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { ok?: boolean; data?: T }
    if (json.ok && json.data) return json.data
  } catch {
    /* API unavailable — caller falls back to the client-rendered page */
  }
  return null
}

export function fetchPropertyServer(id: string): Promise<Property | null> {
  return fetchEntity<Property>(`/properties/${id}/`)
}

export function fetchHotelServer(id: string): Promise<Hotel | null> {
  return fetchEntity<Hotel>(`/hotels/${id}/`)
}

export function fetchMessServer(id: string): Promise<Mess | null> {
  return fetchEntity<Mess>(`/mess/${id}/`)
}

export type SitemapEntity = {
  id: string
  name: string
  city?: string
  area?: string
  updatedAt?: string
}

export type SitemapPayload = {
  listings: SitemapEntity[]
  hotels: SitemapEntity[]
  messes: SitemapEntity[]
}

/** Public inventory for the sitemap. Empty lists when the API is down. */
export async function fetchSitemapEntities(): Promise<SitemapPayload> {
  const data = await fetchEntity<SitemapPayload>('/seo/sitemap/', 3600)
  return {
    listings: data?.listings ?? [],
    hotels: data?.hotels ?? [],
    messes: data?.messes ?? [],
  }
}
