/**
 * JWT access (+ optional refresh) in localStorage.
 * Refresh is also set as an httpOnly cookie; body refresh is a fallback when
 * the cookie is not sent (proxy / host mismatches).
 */

import {
  authStorageGet,
  authStorageRemove,
  authStorageSet,
} from '@/utils/auth-storage'

const ACCESS_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'
const USER_ID_KEY = 'userId'

export function getAccessToken(): string | null {
  return authStorageGet(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return authStorageGet(REFRESH_KEY)
}

export function getStoredUserId(): string | null {
  return authStorageGet(USER_ID_KEY)
}

export function setAuthTokens(params: {
  access: string
  refresh?: string
  userId?: string
}): void {
  if (typeof window === 'undefined') return
  authStorageSet(ACCESS_KEY, params.access)
  // Only touch refresh when the caller provides it — do not wipe a stored
  // refresh on access-only updates.
  if (params.refresh !== undefined) {
    if (params.refresh) {
      authStorageSet(REFRESH_KEY, params.refresh)
    } else {
      authStorageRemove(REFRESH_KEY)
    }
  }
  if (params.userId) {
    authStorageSet(USER_ID_KEY, params.userId)
  }
}

export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return
  authStorageRemove(ACCESS_KEY)
  authStorageRemove(REFRESH_KEY)
  authStorageRemove(USER_ID_KEY)
}

export function hasAuthTokens(): boolean {
  return Boolean(getAccessToken())
}
