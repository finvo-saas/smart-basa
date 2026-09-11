import { NextResponse, type NextRequest } from 'next/server'
import { hotelPath, isEntityId, listingPath, messPath } from './slug'

type SlugEntity = { id: string; name?: string; city?: string; area?: string }

const ROUTES: Record<
  string,
  { resource: string; toPath: (entity: SlugEntity) => string }
> = {
  listings: { resource: 'properties', toPath: listingPath },
  hotels: { resource: 'hotels', toPath: hotelPath },
  messes: { resource: 'mess', toPath: messPath },
}

const DEFAULT_API_BASE = 'http://127.0.0.1:8000/api/v1'
const FETCH_TIMEOUT_MS = 2000
const CACHE_TTL_MS = 10 * 60 * 1000
const CACHE_MAX_ENTRIES = 500

const pathCache = new Map<string, { path: string; expires: number }>()

function apiBase(): string {
  const internal = process.env.API_INTERNAL_URL?.trim()
  if (internal) return internal.replace(/\/$/, '')
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()
  // Middleware runs in Node — relative `/api/v1` cannot be fetched.
  if (raw && !raw.startsWith('/')) return raw.replace(/\/$/, '')
  return DEFAULT_API_BASE
}

function cacheGet(key: string): string | null {
  const hit = pathCache.get(key)
  if (!hit) return null
  if (hit.expires < Date.now()) {
    pathCache.delete(key)
    return null
  }
  return hit.path
}

function cacheSet(key: string, path: string): void {
  if (pathCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = pathCache.keys().next().value
    if (oldest) pathCache.delete(oldest)
  }
  pathCache.set(key, { path, expires: Date.now() + CACHE_TTL_MS })
}

async function canonicalPathFor(
  base: string,
  resource: string,
  id: string,
  toPath: (entity: SlugEntity) => string
): Promise<string | null> {
  const key = `${base}:${id}`
  const cached = cacheGet(key)
  if (cached) return cached

  try {
    const res = await fetch(`${apiBase()}/${resource}/${id}/`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { ok?: boolean; data?: SlugEntity }
    if (!json.ok || !json.data) return null
    const path = toPath(json.data)
    cacheSet(key, path)
    return path
  } catch {
    return null
  }
}

/**
 * Redirect bare-id public URLs (`/listings/<uuid>`) to their canonical
 * `/listings/<slug>-<uuid>` form with a real 308, before the page renders.
 */
export async function canonicalRedirect(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname, search } = request.nextUrl
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length < 2) return null

  const route = ROUTES[segments[0]]
  if (!route) return null

  const param = segments[1]
  if (!isEntityId(param)) return null

  const canonical = await canonicalPathFor(
    segments[0],
    route.resource,
    param,
    route.toPath
  )
  if (!canonical) return null

  const suffix = segments.slice(2).join('/')
  const target = suffix ? `${canonical}/${suffix}` : canonical
  if (target === pathname) return null

  return NextResponse.redirect(new URL(`${target}${search}`, request.url), 308)
}
