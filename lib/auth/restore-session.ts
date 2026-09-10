import { getAccessToken } from '@/utils/auth-tokens'
import { applyAuthSession } from '@/utils/auth'
import { isLogoutGuardActive } from '@/lib/auth/session-events'
import { refreshSession } from '@/lib/api/auth'

/** Restore access JWT from the httpOnly refresh cookie after a tab close. */
export async function restoreSessionFromCookie(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (isLogoutGuardActive()) return false
  if (getAccessToken()) return true
  const result = await refreshSession()
  if (!result.ok) return false
  if (isLogoutGuardActive()) return false
  applyAuthSession(result.data)
  return true
}
