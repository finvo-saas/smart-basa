/** Decouple session mutations from React hooks to avoid import cycles. */

export const AUTH_SESSION_CHANGED = 'auth-session-changed'

const LOGOUT_GUARD_KEY = 'authLoggedOut'

export function notifyAuthSessionChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED))
}

/** Blocks cookie restore / token refresh after an intentional logout. */
export function isLogoutGuardActive(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(LOGOUT_GUARD_KEY) === '1'
}

export function setLogoutGuard(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(LOGOUT_GUARD_KEY, '1')
}

export function clearLogoutGuard(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(LOGOUT_GUARD_KEY)
}
