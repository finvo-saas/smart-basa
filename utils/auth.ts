import { UserRole } from '@/types'
import type { AdminRole } from '@/types/admin'
import type { UserVerificationStatus } from '@/types/userVerification'
import type { AuthSession, AuthUser } from '@/lib/api/auth'
import { notifyAuthSessionChanged, setLogoutGuard, clearLogoutGuard } from '@/lib/auth/session-events'
import {
  clearDemoIdentity,
  syncDemoIdentityForRole,
} from '@/lib/auth/demo-identity'
import { clearAuthTokens, setAuthTokens } from '@/utils/auth-tokens'
import {
  authStorageGet,
  authStorageRemove,
  authStorageSet,
} from '@/utils/auth-storage'
import { getDefaultPathForRole } from '@/lib/auth'
import {
  normalizeOwnerVerticals,
  type OwnerVertical,
} from '@/lib/owner-focus'

const OWNER_VERTICALS_KEY = 'ownerEnabledVerticals'
const OWNER_PRIMARY_KEY = 'ownerPrimaryFocus'
const OWNER_FOCUS_SELECTED_KEY = 'ownerFocusSelected'

function persistOwnerFocus(user: AuthUser): void {
  if (user.role !== 'owner') {
    authStorageRemove(OWNER_VERTICALS_KEY)
    authStorageRemove(OWNER_PRIMARY_KEY)
    authStorageRemove(OWNER_FOCUS_SELECTED_KEY)
    return
  }
  authStorageSet(
    OWNER_VERTICALS_KEY,
    JSON.stringify(
      normalizeOwnerVerticals(
        user.ownerEnabledVerticals,
        user.ownerPrimaryFocus,
      ),
    ),
  )
  authStorageSet(OWNER_PRIMARY_KEY, user.ownerPrimaryFocus || '')
  authStorageSet(
    OWNER_FOCUS_SELECTED_KEY,
    user.ownerFocusSelected ? 'true' : 'false',
  )
}

export function getStoredOwnerVerticals(): OwnerVertical[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = authStorageGet(OWNER_VERTICALS_KEY)
    if (!raw) return []
    const primary = authStorageGet(OWNER_PRIMARY_KEY) || ''
    return normalizeOwnerVerticals(JSON.parse(raw), primary)
  } catch {
    return []
  }
}

export function getStoredOwnerPrimaryFocus(): OwnerVertical | '' {
  if (typeof window === 'undefined') return ''
  const raw = authStorageGet(OWNER_PRIMARY_KEY) || ''
  return normalizeOwnerVerticals([raw])[0] || ''
}

export function isOwnerFocusSelected(): boolean {
  if (typeof window === 'undefined') return false
  return authStorageGet(OWNER_FOCUS_SELECTED_KEY) === 'true'
}

/** Re-export for callers that import from utils/auth. */
export { isLogoutGuardActive } from '@/lib/auth/session-events'

export const getStoredRole = (): UserRole | null => {
  if (typeof window === 'undefined') return null
  const role = authStorageGet('userRole') as UserRole | null
  return role || null
}

export const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false
  return authStorageGet('isLoggedIn') === 'true'
}

export const isOtpVerified = (): boolean => {
  if (typeof window === 'undefined') return false
  return authStorageGet('otpVerified') === 'true'
}

export const getLoginPhone = (): string | null => {
  if (typeof window === 'undefined') return null
  return authStorageGet('loginPhone')
}

export const hasCompleteSession = (): boolean => {
  return (
    isLoggedIn() &&
    isOtpVerified() &&
    getStoredRole() !== null &&
    !needsPinSetup()
  )
}

export const needsPinSetup = (): boolean => {
  if (typeof window === 'undefined') return false
  return authStorageGet('needsPinSetup') === 'true'
}

export const isPinResetFlow = (): boolean => {
  if (typeof window === 'undefined') return false
  return authStorageGet('pinReset') === 'true'
}

export const setUserSession = (params: {
  role: UserRole
  phone?: string
  name?: string
}): void => {
  if (typeof window === 'undefined') return
  clearLogoutGuard()
  authStorageSet('isLoggedIn', 'true')
  authStorageSet('otpVerified', 'true')
  authStorageSet('userRole', params.role)
  if (params.phone) authStorageSet('loginPhone', params.phone)
  if (params.name) authStorageSet('userName', params.name)
  syncDemoIdentityForRole(params.role)
  notifyAuthSessionChanged()
}

/** Apply OTP/role API session to persisted storage + JWT tokens. */
export function applyAuthSession(
  session: AuthSession,
  options?: { complete?: boolean },
): void {
  if (typeof window === 'undefined') return

  clearLogoutGuard()

  setAuthTokens({
    access: session.access,
    refresh: session.refresh,
    userId: session.user.id,
  })

  const phoneDigits = session.user.phoneDigits
  authStorageSet('loginPhone', phoneDigits)
  authStorageSet('otpVerified', 'true')
  authStorageSet(
    'needsPinSetup',
    session.needsPinSetup ? 'true' : 'false',
  )
  authStorageSet('hasPin', session.hasPin ? 'true' : 'false')

  const complete =
    options?.complete ??
    (Boolean(session.user.roleSelected) &&
      !session.needsRoleSelection &&
      !Boolean(session.needsPinSetup))

  if (complete) {
    authStorageSet('isLoggedIn', 'true')
    authStorageSet('userRole', session.user.role)
    if (session.user.name) {
      authStorageSet('userName', session.user.name)
    }
    if (session.user.profilePhotoUrl) {
      authStorageSet('profilePhotoUrl', session.user.profilePhotoUrl)
    }
    if (session.user.role === 'admin' && session.adminRole) {
      authStorageSet('adminRole', session.adminRole)
      authStorageSet('adminId', session.user.id)
    } else {
      authStorageRemove('adminRole')
      authStorageRemove('adminId')
    }
    persistOwnerFocus(session.user)
    syncDemoIdentityForRole(session.user.role)
  } else {
    authStorageRemove('isLoggedIn')
    authStorageRemove('userRole')
  }

  authStorageSet(
    'availableRoles',
    JSON.stringify(session.availableRoles),
  )
  if (session.adminRole) {
    authStorageSet('pendingAdminRole', session.adminRole)
  } else {
    authStorageRemove('pendingAdminRole')
  }

  notifyAuthSessionChanged()
}

const AUTH_RETURN_KEY = 'sl_auth_return'

function safeInternalPath(path: string): string | null {
  const trimmed = path.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null
  if (trimmed.startsWith('/login') || trimmed.startsWith('/otp-verify')) return null
  return trimmed
}

/** Remember where a guest was going (request a seat, mess book) across login. */
export function rememberAuthReturn(path: string): void {
  if (typeof window === 'undefined') return
  const safe = safeInternalPath(path)
  if (!safe) return
  sessionStorage.setItem(AUTH_RETURN_KEY, safe)
}

export function peekAuthReturn(): string | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(AUTH_RETURN_KEY)
  return raw ? safeInternalPath(raw) : null
}

export function consumeAuthReturn(): string | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(AUTH_RETURN_KEY)
  sessionStorage.removeItem(AUTH_RETURN_KEY)
  return raw ? safeInternalPath(raw) : null
}

export function nextPathAfterAuth(session: AuthSession): string {
  if (session.needsPinSetup || isPinResetFlow()) return '/set-pin'
  if (session.needsRoleSelection || !session.user.roleSelected) {
    return '/role-selection'
  }
  const back = consumeAuthReturn()
  if (back) return back
  if (session.user.role === 'admin') return '/admin'
  return getDefaultPathForRole(session.user.role)
}

export function getAvailableRolesFromSession(): UserRole[] {
  if (typeof window === 'undefined') return ['renter', 'owner']
  try {
    const raw = authStorageGet('availableRoles')
    if (!raw) return ['renter', 'owner']
    return JSON.parse(raw) as UserRole[]
  } catch {
    return ['renter', 'owner']
  }
}

export function getPendingAdminRole(): AdminRole | null {
  if (typeof window === 'undefined') return null
  return authStorageGet('pendingAdminRole') as AdminRole | null
}

export const getVerificationStatus = (): UserVerificationStatus => {
  if (typeof window === 'undefined') return 'unverified'
  const stored = authStorageGet(
    'verificationStatus',
  ) as UserVerificationStatus | null
  return stored || 'unverified'
}

export const setVerificationStatus = (
  status: UserVerificationStatus,
): void => {
  if (typeof window === 'undefined') return
  authStorageSet('verificationStatus', status)
}

/** Wipe client auth state (tokens + session flags). */
export function clearLocalAuthState(): void {
  if (typeof window === 'undefined') return
  clearAuthTokens()
  authStorageRemove('isLoggedIn')
  authStorageRemove('userRole')
  authStorageRemove('loginPhone')
  authStorageRemove('otpVerified')
  authStorageRemove('userName')
  authStorageRemove('profilePhotoUrl')
  authStorageRemove('adminRole')
  authStorageRemove('adminId')
  authStorageRemove('verificationStatus')
  authStorageRemove('availableRoles')
  authStorageRemove('pendingAdminRole')
  authStorageRemove('devOtp')
  authStorageRemove('needsPinSetup')
  authStorageRemove('hasPin')
  authStorageRemove('pinReset')
  authStorageRemove(OWNER_VERTICALS_KEY)
  authStorageRemove(OWNER_PRIMARY_KEY)
  authStorageRemove(OWNER_FOCUS_SELECTED_KEY)
  clearDemoIdentity()
}

/**
 * Sign out: revoke refresh cookie on the API, then clear local session.
 * Owners and renters always land on the home page. Admin stays put so the
 * admin layout can send them to /admin/login.
 */
export async function logout(): Promise<void> {
  if (typeof window === 'undefined') return
  const role = getStoredRole()
  setLogoutGuard()
  try {
    const { logoutApi } = await import('@/lib/api/auth')
    await logoutApi()
  } catch {
    /* still clear client state */
  }
  clearLocalAuthState()
  notifyAuthSessionChanged()
  if (role !== 'admin') {
    window.location.replace('/')
  }
}

export const getStoredAdminRole = (): AdminRole | null => {
  if (typeof window === 'undefined') return null
  const role = authStorageGet('adminRole') as AdminRole | null
  return role || null
}

export const isAdminSession = (): boolean => {
  return getStoredRole() === 'admin' && getStoredAdminRole() !== null
}

export const setAdminSession = (params: {
  phone: string
  adminRole: AdminRole
  adminId?: string
  name?: string
}): void => {
  /**
   * @deprecated Prefer applyAuthSession after real OTP verify.
   * Does NOT store JWTs — admin API calls will return empty without tokens.
   */
  if (typeof window === 'undefined') return
  clearLogoutGuard()
  authStorageSet('isLoggedIn', 'true')
  authStorageSet('otpVerified', 'true')
  authStorageSet('userRole', 'admin')
  authStorageSet('loginPhone', params.phone)
  authStorageSet('adminRole', params.adminRole)
  authStorageSet('adminId', params.adminId ?? 'admin1')
  if (params.name) authStorageSet('userName', params.name)
  notifyAuthSessionChanged()
}

export const getDisplayName = (): string => {
  if (typeof window === 'undefined') return 'Guest'
  const storedName = authStorageGet('userName')
  if (storedName) return storedName
  const phone = authStorageGet('loginPhone')
  if (phone) return `User ${phone.slice(-4)}`
  return 'Guest'
}

export const getProfilePhotoUrl = (): string | null => {
  if (typeof window === 'undefined') return null
  return authStorageGet('profilePhotoUrl')
}

export function syncUserDisplay(user: AuthUser): void {
  if (typeof window === 'undefined') return
  if (user.name) authStorageSet('userName', user.name)
  if (user.profilePhotoUrl) {
    authStorageSet('profilePhotoUrl', user.profilePhotoUrl)
  } else if (user.profilePhotoUrl === null || user.profilePhotoUrl === '') {
    authStorageRemove('profilePhotoUrl')
  }
  authStorageSet('loginPhone', user.phoneDigits)
  if (user.role) authStorageSet('userRole', user.role)
  persistOwnerFocus(user)
  notifyAuthSessionChanged()
}
