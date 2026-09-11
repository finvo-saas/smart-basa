import { getAccessToken } from '@/utils/auth-tokens'
import { clearLocalAuthState, isLoggedIn } from '@/utils/auth'
import {
  isLogoutGuardActive,
  notifyAuthSessionChanged,
} from '@/lib/auth/session-events'
import { refreshAccessToken } from '@/lib/api/client'

/**
 * Rehydrate access JWT after reload/tab close.
 * Session flags live in localStorage until the user logs out; the httpOnly
 * refresh cookie is used only when the access token is missing.
 */
export async function restoreSessionFromCookie(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (isLogoutGuardActive()) return false

  // Persisted login with access token still present — stay signed in.
  if (getAccessToken()) return true

  // No local session hint — do not hit refresh (avoids anonymous 401 spam).
  if (!isLoggedIn()) return false

  const ok = await refreshAccessToken()
  if (!ok) {
    // Refresh cookie gone/invalid — only then drop the persisted session.
    if (isLoggedIn() && !isLogoutGuardActive()) {
      clearLocalAuthState()
      notifyAuthSessionChanged()
    }
    return false
  }
  if (isLogoutGuardActive()) return false
  return true
}
