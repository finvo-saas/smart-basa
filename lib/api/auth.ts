import { apiRequest } from './client'
import type { ApiResult } from './http'
import type { UserRole } from '@/types'
import type { AdminRole } from '@/types/admin'
import { setAuthTokens, clearAuthTokens, getRefreshToken } from '@/utils/auth-tokens'

export type AuthUser = {
  id: string
  phone: string
  phoneDigits: string
  /** WhatsApp number shown on public listings; '' when not added. */
  whatsappNumber: string
  email: string
  name: string
  role: UserRole
  roleSelected: boolean
  isPhoneVerified: boolean
  hasPin: boolean
  profilePhotoUrl: string | null
  /** Absolute media URL (same as profilePhotoUrl when present). */
  profilePhoto?: string | null
  locale: string
  heartbeatSmsOptIn?: boolean
  pushOptIn?: boolean
  ownerPrimaryFocus?: import('@/lib/owner-focus').OwnerVertical | ''
  ownerEnabledVerticals?: import('@/lib/owner-focus').OwnerVertical[]
  ownerFocusSelected?: boolean
  adminRole: AdminRole | null
  createdAt: string
  updatedAt: string
}

export type AuthSession = {
  access: string
  refresh?: string
  user: AuthUser
  needsRoleSelection: boolean
  needsPinSetup: boolean
  hasPin: boolean
  availableRoles: UserRole[]
  adminRole: AdminRole | null
}

export type OtpRequestResult = {
  phone: string
  expiresIn: number
  purpose: string
  smsDelivered?: boolean
  /** Present only when SMS fell back to console (local testing) */
  devOtp?: string
}

export type LoginStartResult = {
  next: 'pin' | 'otp'
  phone: string
  hasPin: boolean
  trustedDevice: boolean
  expiresIn?: number
  purpose?: string
  smsDelivered?: boolean
  devOtp?: string
}

function persistTokens(
  session: Pick<AuthSession, 'access' | 'refresh' | 'user'>,
) {
  setAuthTokens({
    access: session.access,
    refresh: session.refresh,
    userId: session.user.id,
  })
}

export async function startLogin(params: {
  phone: string
  asAdmin?: boolean
}): Promise<ApiResult<LoginStartResult>> {
  return apiRequest<LoginStartResult>('/auth/login/start/', {
    method: 'POST',
    auth: false,
    body: { phone: params.phone, asAdmin: params.asAdmin ?? false },
  })
}

export async function requestOtp(params: {
  phone: string
  purpose?: 'login' | 'recover'
}): Promise<ApiResult<OtpRequestResult>> {
  return apiRequest<OtpRequestResult>('/auth/otp/request/', {
    method: 'POST',
    auth: false,
    body: {
      phone: params.phone,
      purpose: params.purpose ?? 'login',
    },
  })
}

export async function verifyOtp(params: {
  phone: string
  otp: string
  purpose?: 'login' | 'recover'
  asAdmin?: boolean
}): Promise<ApiResult<AuthSession>> {
  const result = await apiRequest<AuthSession>('/auth/otp/verify/', {
    method: 'POST',
    auth: false,
    body: {
      phone: params.phone,
      otp: params.otp,
      purpose: params.purpose ?? 'login',
      asAdmin: params.asAdmin ?? false,
    },
  })
  if (result.ok) {
    persistTokens(result.data)
  }
  return result
}

export async function loginWithPin(params: {
  phone: string
  pin: string
}): Promise<ApiResult<AuthSession>> {
  const result = await apiRequest<AuthSession>('/auth/pin/login/', {
    method: 'POST',
    auth: false,
    body: {
      phone: params.phone,
      pin: params.pin,
    },
  })
  if (result.ok) {
    persistTokens(result.data)
  }
  return result
}

export async function setPin(params: {
  pin: string
  confirmPin: string
  currentPin?: string
}): Promise<ApiResult<AuthSession>> {
  const result = await apiRequest<AuthSession>('/auth/pin/set/', {
    method: 'POST',
    body: {
      pin: params.pin,
      confirmPin: params.confirmPin,
      currentPin: params.currentPin || undefined,
    },
  })
  if (result.ok) {
    persistTokens(result.data)
  }
  return result
}

export async function refreshSession(): Promise<ApiResult<AuthSession>> {
  const refresh = getRefreshToken()
  const result = await apiRequest<AuthSession>('/auth/token/refresh/', {
    method: 'POST',
    auth: false,
    body: refresh ? { refresh } : {},
  })
  if (result.ok) {
    persistTokens(result.data)
  }
  return result
}

export async function selectRole(
  role: UserRole,
): Promise<ApiResult<AuthSession>> {
  const result = await apiRequest<AuthSession>('/auth/role/select/', {
    method: 'POST',
    body: { role },
  })
  if (result.ok) {
    persistTokens(result.data)
  }
  return result
}

export async function fetchCurrentUser(): Promise<ApiResult<AuthUser>> {
  return apiRequest<AuthUser>('/accounts/me/')
}

export async function updateCurrentUser(input: {
  name?: string
  email?: string
  locale?: string
  whatsappNumber?: string
  profilePhoto?: File
  heartbeatSmsOptIn?: boolean
  pushOptIn?: boolean
  ownerPrimaryFocus?: import('@/lib/owner-focus').OwnerVertical | ''
  ownerEnabledVerticals?: import('@/lib/owner-focus').OwnerVertical[]
  ownerFocusSelected?: boolean
}): Promise<ApiResult<AuthUser>> {
  if (input.profilePhoto) {
    const form = new FormData()
    if (input.name !== undefined) form.append('name', input.name)
    if (input.email !== undefined) form.append('email', input.email)
    if (input.locale !== undefined) form.append('locale', input.locale)
    if (input.whatsappNumber !== undefined) {
      form.append('whatsappNumber', input.whatsappNumber)
    }
    if (input.heartbeatSmsOptIn !== undefined) {
      form.append('heartbeatSmsOptIn', String(input.heartbeatSmsOptIn))
    }
    if (input.pushOptIn !== undefined) {
      form.append('pushOptIn', String(input.pushOptIn))
    }
    if (input.ownerPrimaryFocus !== undefined) {
      form.append('ownerPrimaryFocus', input.ownerPrimaryFocus)
    }
    if (input.ownerEnabledVerticals !== undefined) {
      form.append(
        'ownerEnabledVerticals',
        JSON.stringify(input.ownerEnabledVerticals),
      )
    }
    if (input.ownerFocusSelected !== undefined) {
      form.append('ownerFocusSelected', String(input.ownerFocusSelected))
    }
    form.append('profilePhoto', input.profilePhoto)
    return apiRequest<AuthUser>('/accounts/me/', {
      method: 'PATCH',
      formData: form,
    })
  }

  const body: Record<string, unknown> = {}
  if (input.name !== undefined) body.name = input.name
  if (input.email !== undefined) body.email = input.email
  if (input.locale !== undefined) body.locale = input.locale
  if (input.whatsappNumber !== undefined) {
    body.whatsappNumber = input.whatsappNumber
  }
  if (input.heartbeatSmsOptIn !== undefined) {
    body.heartbeatSmsOptIn = input.heartbeatSmsOptIn
  }
  if (input.pushOptIn !== undefined) body.pushOptIn = input.pushOptIn
  if (input.ownerPrimaryFocus !== undefined) {
    body.ownerPrimaryFocus = input.ownerPrimaryFocus
  }
  if (input.ownerEnabledVerticals !== undefined) {
    body.ownerEnabledVerticals = input.ownerEnabledVerticals
  }
  if (input.ownerFocusSelected !== undefined) {
    body.ownerFocusSelected = input.ownerFocusSelected
  }
  return apiRequest<AuthUser>('/accounts/me/', {
    method: 'PATCH',
    body,
  })
}

export async function logoutApi(): Promise<ApiResult<{ loggedOut: boolean }>> {
  const result = await apiRequest<{ loggedOut: boolean }>('/auth/logout/', {
    method: 'POST',
    auth: false,
    body: {},
  })
  clearAuthTokens()
  return result
}
