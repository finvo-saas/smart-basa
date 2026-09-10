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
    sessionStorage.removeItem(OWNER_VERTICALS_KEY)
    sessionStorage.removeItem(OWNER_PRIMARY_KEY)
    sessionStorage.removeItem(OWNER_FOCUS_SELECTED_KEY)
    return
  }
  sessionStorage.setItem(
    OWNER_VERTICALS_KEY,
    JSON.stringify(normalizeOwnerVerticals(user.ownerEnabledVerticals)),
  )
  sessionStorage.setItem(OWNER_PRIMARY_KEY, user.ownerPrimaryFocus || '')
  sessionStorage.setItem(
    OWNER_FOCUS_SELECTED_KEY,
    user.ownerFocusSelected ? 'true' : 'false',
  )
}

export function getStoredOwnerVerticals(): OwnerVertical[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(OWNER_VERTICALS_KEY)
    if (!raw) return []
    return normalizeOwnerVerticals(JSON.parse(raw))
  } catch {
    return []
  }
}

export function getStoredOwnerPrimaryFocus(): OwnerVertical | '' {
  if (typeof window === 'undefined') return ''
  const raw = sessionStorage.getItem(OWNER_PRIMARY_KEY) || ''
  return normalizeOwnerVerticals([raw])[0] || ''
}

export function isOwnerFocusSelected(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(OWNER_FOCUS_SELECTED_KEY) === 'true'
}

/** Re-export for callers that import from utils/auth. */
export { isLogoutGuardActive } from '@/lib/auth/session-events'

export const getStoredRole = (): UserRole | null => {
  if (typeof window === 'undefined') return null
  const role = sessionStorage.getItem('userRole') as UserRole | null
  return role || null
}

export const isLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('isLoggedIn') === 'true'
}

export const isOtpVerified = (): boolean => {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('otpVerified') === 'true'
}

export const getLoginPhone = (): string | null => {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('loginPhone')
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
  return sessionStorage.getItem('needsPinSetup') === 'true'
}

export const isPinResetFlow = (): boolean => {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('pinReset') === 'true'
}

export const setUserSession = (params: {
  role: UserRole
  phone?: string
  name?: string
}): void => {
  if (typeof window === 'undefined') return
  clearLogoutGuard()
  sessionStorage.setItem('isLoggedIn', 'true')
  sessionStorage.setItem('otpVerified', 'true')
  sessionStorage.setItem('userRole', params.role)
  if (params.phone) sessionStorage.setItem('loginPhone', params.phone)
  if (params.name) sessionStorage.setItem('userName', params.name)
  syncDemoIdentityForRole(params.role)
  notifyAuthSessionChanged()
}

/** Apply OTP/role API session to sessionStorage + JWT tokens. */
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
  sessionStorage.setItem('loginPhone', phoneDigits)
  sessionStorage.setItem('otpVerified', 'true')
  sessionStorage.setItem(
    'needsPinSetup',
    session.needsPinSetup ? 'true' : 'false',
  )
  sessionStorage.setItem('hasPin', session.hasPin ? 'true' : 'false')

  const complete =
    options?.complete ??
    (Boolean(session.user.roleSelected) &&
      !session.needsRoleSelection &&
      !Boolean(session.needsPinSetup))

  if (complete) {
    sessionStorage.setItem('isLoggedIn', 'true')
    sessionStorage.setItem('userRole', session.user.role)
    if (session.user.name) {
      sessionStorage.setItem('userName', session.user.name)
    }
    if (session.user.profilePhotoUrl) {
      sessionStorage.setItem('profilePhotoUrl', session.user.profilePhotoUrl)
    }
    if (session.user.role === 'admin' && session.adminRole) {
      sessionStorage.setItem('adminRole', session.adminRole)
      sessionStorage.setItem('adminId', session.user.id)
    } else {
      sessionStorage.removeItem('adminRole')
      sessionStorage.removeItem('adminId')
    }
    persistOwnerFocus(session.user)
    syncDemoIdentityForRole(session.user.role)
  } else {
    sessionStorage.removeItem('isLoggedIn')
    sessionStorage.removeItem('userRole')
  }

  sessionStorage.setItem(
    'availableRoles',
    JSON.stringify(session.availableRoles),
  )
  if (session.adminRole) {
    sessionStorage.setItem('pendingAdminRole', session.adminRole)
  } else {
    sessionStorage.removeItem('pendingAdminRole')
  }

  notifyAuthSessionChanged()
}

export function nextPathAfterAuth(session: AuthSession): string {
  if (session.needsPinSetup || isPinResetFlow()) return '/set-pin'
  if (session.needsRoleSelection || !session.user.roleSelected) {
    return '/role-selection'
  }
  if (session.user.role === 'admin') return '/admin'
  return getDefaultPathForRole(session.user.role)
}

export function getAvailableRolesFromSession(): UserRole[] {
  if (typeof window === 'undefined') return ['renter', 'owner']
  try {
    const raw = sessionStorage.getItem('availableRoles')
    if (!raw) return ['renter', 'owner']
    return JSON.parse(raw) as UserRole[]
  } catch {
    return ['renter', 'owner']
  }
}

export function getPendingAdminRole(): AdminRole | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('pendingAdminRole') as AdminRole | null
}

export const getVerificationStatus = (): UserVerificationStatus => {
  if (typeof window === 'undefined') return 'unverified'
  const stored = sessionStorage.getItem(
    'verificationStatus',
  ) as UserVerificationStatus | null
  return stored || 'unverified'
}

export const setVerificationStatus = (
  status: UserVerificationStatus,
): void => {
  if (typeof window === 'undefined') return
  sessionStorage.setItem('verificationStatus', status)
}

/** Wipe client auth state (tokens + session flags). */
export function clearLocalAuthState(): void {
  if (typeof window === 'undefined') return
  clearAuthTokens()
  sessionStorage.removeItem('isLoggedIn')
  sessionStorage.removeItem('userRole')
  sessionStorage.removeItem('loginPhone')
  sessionStorage.removeItem('otpVerified')
  sessionStorage.removeItem('userName')
  sessionStorage.removeItem('profilePhotoUrl')
  sessionStorage.removeItem('adminRole')
  sessionStorage.removeItem('adminId')
  sessionStorage.removeItem('verificationStatus')
  sessionStorage.removeItem('availableRoles')
  sessionStorage.removeItem('pendingAdminRole')
  sessionStorage.removeItem('devOtp')
  sessionStorage.removeItem('needsPinSetup')
  sessionStorage.removeItem('hasPin')
  sessionStorage.removeItem('pinReset')
  sessionStorage.removeItem(OWNER_VERTICALS_KEY)
  sessionStorage.removeItem(OWNER_PRIMARY_KEY)
  sessionStorage.removeItem(OWNER_FOCUS_SELECTED_KEY)
  clearDemoIdentity()
}

/**
 * Sign out: revoke refresh cookie on the API, then clear local session.
 * Prefer awaiting this before navigating away.
 */
export async function logout(): Promise<void> {
  if (typeof window === 'undefined') return
  setLogoutGuard()
  try {
    const { logoutApi } = await import('@/lib/api/auth')
    await logoutApi()
  } catch {
    /* still clear client state */
  }
  clearLocalAuthState()
  notifyAuthSessionChanged()
}

export const getStoredAdminRole = (): AdminRole | null => {
  if (typeof window === 'undefined') return null
  const role = sessionStorage.getItem('adminRole') as AdminRole | null
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
  sessionStorage.setItem('isLoggedIn', 'true')
  sessionStorage.setItem('otpVerified', 'true')
  sessionStorage.setItem('userRole', 'admin')
  sessionStorage.setItem('loginPhone', params.phone)
  sessionStorage.setItem('adminRole', params.adminRole)
  sessionStorage.setItem('adminId', params.adminId ?? 'admin1')
  if (params.name) sessionStorage.setItem('userName', params.name)
  notifyAuthSessionChanged()
}

export const getDisplayName = (): string => {
  if (typeof window === 'undefined') return 'Guest'
  const storedName = sessionStorage.getItem('userName')
  if (storedName) return storedName
  const phone = sessionStorage.getItem('loginPhone')
  if (phone) return `User ${phone.slice(-4)}`
  return 'Guest'
}

export const getProfilePhotoUrl = (): string | null => {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('profilePhotoUrl')
}

export function syncUserDisplay(user: AuthUser): void {
  if (typeof window === 'undefined') return
  if (user.name) sessionStorage.setItem('userName', user.name)
  if (user.profilePhotoUrl) {
    sessionStorage.setItem('profilePhotoUrl', user.profilePhotoUrl)
  }
  sessionStorage.setItem('loginPhone', user.phoneDigits)
  if (user.role) sessionStorage.setItem('userRole', user.role)
  persistOwnerFocus(user)
  notifyAuthSessionChanged()
}
