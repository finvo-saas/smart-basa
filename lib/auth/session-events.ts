/** Decouple session mutations from React hooks to avoid import cycles. */

import {
  authStorageGet,
  authStorageRemove,
  authStorageSet,
} from '@/utils/auth-storage'

export const AUTH_SESSION_CHANGED = 'auth-session-changed'

/** Survives tab close so intentional logout is not undone by cookie restore. */
const LOGOUT_GUARD_KEY = 'authLoggedOut'

export function notifyAuthSessionChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED))
}

/** Blocks cookie restore / token refresh after an intentional logout. */
export function isLogoutGuardActive(): boolean {
  return authStorageGet(LOGOUT_GUARD_KEY) === '1'
}

export function setLogoutGuard(): void {
  authStorageSet(LOGOUT_GUARD_KEY, '1')
}

export function clearLogoutGuard(): void {
  authStorageRemove(LOGOUT_GUARD_KEY)
}
