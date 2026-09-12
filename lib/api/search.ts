import type { SavedSearch } from '@/types/savedSearch'
import type { SearchHistory } from '@/types/favorites'
import type { Property } from '@/types/property'
import { apiRequest } from './client'
import type { ApiResult } from './http'
import { hasAuthTokens } from '@/utils/auth-tokens'

export async function fetchSavedSearches(
  _userId?: string,
): Promise<ApiResult<SavedSearch[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<SavedSearch[]>('/saved-searches/')
}

export async function createSavedSearch(
  search: Pick<SavedSearch, 'name' | 'filters' | 'isActive'> &
    Partial<SavedSearch>,
): Promise<ApiResult<SavedSearch>> {
  if (!hasAuthTokens()) {
    return { ok: false, error: 'Sign in to save a search.', code: 'UNAUTHORIZED' }
  }
  return apiRequest<SavedSearch>('/saved-searches/', {
    method: 'POST',
    body: {
      name: search.name,
      filters: search.filters,
      isActive: search.isActive,
    },
  })
}

export async function deleteSavedSearch(id: string): Promise<ApiResult<null>> {
  return apiRequest<null>(`/saved-searches/${id}/`, { method: 'DELETE' })
}

export async function patchSavedSearch(
  id: string,
  updates: Partial<SavedSearch>,
): Promise<ApiResult<SavedSearch>> {
  return apiRequest<SavedSearch>(`/saved-searches/${id}/`, {
    method: 'PATCH',
    body: {
      name: updates.name,
      filters: updates.filters,
      isActive: updates.isActive,
      matchCount: updates.matchCount,
      lastChecked: updates.lastChecked,
    },
  })
}

export async function fetchSearchHistory(
  _userId?: string,
): Promise<ApiResult<SearchHistory[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<SearchHistory[]>('/search-history/')
}

export async function recordSearchHistory(
  entry: Omit<SearchHistory, 'id' | 'searchedAt'>,
): Promise<ApiResult<SearchHistory | null>> {
  if (!hasAuthTokens()) return { ok: true, data: null }
  return apiRequest<SearchHistory>('/search-history/', {
    method: 'POST',
    body: {
      searchQuery: entry.searchQuery ?? '',
      filters: entry.filters,
      resultCount: entry.resultCount,
    },
  })
}

export async function clearUserSearchHistory(
  _userId?: string,
): Promise<ApiResult<null>> {
  return apiRequest<null>('/search-history/clear/', { method: 'DELETE' })
}

export async function deleteSearchHistoryEntry(
  id: string,
): Promise<ApiResult<null>> {
  return apiRequest<null>(`/search-history/${id}/`, { method: 'DELETE' })
}

export type SearchMatchNotification = {
  savedSearch: SavedSearch
  newMatches: Property[]
  matchCount: number
}

export async function fetchSearchMatchNotifications(
  _userId?: string,
): Promise<ApiResult<SearchMatchNotification[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<SearchMatchNotification[]>('/search/notifications/')
}

export async function getSavedSearchById(
  id: string,
): Promise<SavedSearch | undefined> {
  const result = await fetchSavedSearches()
  if (!result.ok) return undefined
  return result.data.find(s => s.id === id)
}
