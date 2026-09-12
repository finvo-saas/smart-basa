import { createSavedSearch } from '@/lib/api/search'
import type { ApiResult } from '@/lib/api/http'
import type { SearchFilters } from '@/types/property'
import type { SavedSearch } from '@/types/savedSearch'

const PENDING_KEY = 'sl_pending_saved_search'

export type PendingSavedSearch = {
  filters: SearchFilters
  query?: string
  name: string
}

export function suggestedSearchName(
  filters: SearchFilters,
  query?: string,
): string {
  const parts: string[] = []
  if (filters.propertyType && filters.propertyType !== 'all') {
    parts.push(
      filters.propertyType.charAt(0).toUpperCase() + filters.propertyType.slice(1),
    )
  }
  if (filters.city) parts.push(filters.city)
  if (filters.area) parts.push(filters.area)
  if (query?.trim()) parts.push(query.trim())
  const name = parts.join(' · ') || 'My search'
  return name.slice(0, 50)
}

export function stashPendingSavedSearch(
  filters: SearchFilters,
  query?: string,
): void {
  if (typeof window === 'undefined') return
  const pending: PendingSavedSearch = {
    filters,
    query: query?.trim() || undefined,
    name: suggestedSearchName(filters, query),
  }
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
}

export function peekPendingSavedSearch(): PendingSavedSearch | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(PENDING_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PendingSavedSearch
    if (!parsed?.filters || !parsed.name) return null
    return parsed
  } catch {
    return null
  }
}

export function clearPendingSavedSearch(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PENDING_KEY)
}

let finishing = false

/** Create the search the guest started, once, after they are signed in. */
export async function finishPendingSavedSearch(): Promise<ApiResult<SavedSearch> | null> {
  if (finishing) return null
  const pending = peekPendingSavedSearch()
  if (!pending) return null
  finishing = true
  clearPendingSavedSearch()
  const result = await createSavedSearch({
    name: pending.name,
    filters: pending.filters,
    isActive: true,
  })
  finishing = false
  if (!result.ok) {
    stashPendingSavedSearch(pending.filters, pending.query)
  }
  return result
}
