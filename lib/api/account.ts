import { apiRequest } from './client'
import { getStoredUserId } from '@/utils/auth-tokens'
import type { ApiResult } from './http'
import type { AuthSession } from './auth'
import { setAuthTokens } from '@/utils/auth-tokens'
import { authStorageSet } from '@/utils/auth-storage'

export async function requestPhoneChangeOtp(params: {
  newPhone: string
}): Promise<
  ApiResult<{ phone: string; expiresIn: number; purpose: string; devOtp?: string }>
> {
  return apiRequest('/account/phone-change/request/', {
    method: 'POST',
    body: { newPhone: params.newPhone },
  })
}

export async function requestPhoneChange(params: {
  newPhone: string
  otp: string
}): Promise<
  ApiResult<{
    phone: string
    phoneDigits: string
    user: AuthSession['user']
    access: string
    refresh?: string
  }>
> {
  const result = await apiRequest<{
    phone: string
    phoneDigits: string
    user: AuthSession['user']
    access: string
    refresh?: string
  }>('/account/phone-change/confirm/', {
    method: 'POST',
    body: { newPhone: params.newPhone, otp: params.otp },
  })
  if (result.ok) {
    setAuthTokens({
      access: result.data.access,
      refresh: result.data.refresh,
      userId: result.data.user.id,
    })
    if (typeof window !== 'undefined') {
      authStorageSet('loginPhone', result.data.phoneDigits)
    }
  }
  return result
}

export async function requestRecoverOtp(params: {
  phone: string
}): Promise<
  ApiResult<{ phone: string; expiresIn: number; purpose: string; devOtp?: string }>
> {
  return apiRequest('/auth/otp/request/', {
    method: 'POST',
    auth: false,
    body: { phone: params.phone, purpose: 'recover' },
  })
}

export async function recoverAccount(params: {
  phone: string
  otp: string
}): Promise<ApiResult<AuthSession & { recovered: true }>> {
  const result = await apiRequest<AuthSession & { recovered: true }>(
    '/account/recover/',
    {
      method: 'POST',
      auth: false,
      body: { phone: params.phone, otp: params.otp },
    },
  )
  if (result.ok) {
    setAuthTokens({
      access: result.data.access,
      refresh: result.data.refresh,
      userId: result.data.user.id,
    })
  }
  return result
}

/** JWT session user id. Empty when logged out — never a demo placeholder. */
export function getCurrentAccountUserId(): string {
  return getStoredUserId() || ''
}

export interface CIMSStatus {
  cimsRegistered: boolean
  cimsRegistrationNumber: string
  cimsPoliceStation: string
  cimsRegisteredAt: string | null
  cimsReminderDismissed: boolean
  required: boolean
}

export async function fetchCIMSStatus(): Promise<ApiResult<CIMSStatus>> {
  return apiRequest<CIMSStatus>('/account/cims/')
}

export async function updateCIMSStatus(
  data: Partial<CIMSStatus>,
): Promise<ApiResult<CIMSStatus>> {
  return apiRequest<CIMSStatus>('/account/cims/', {
    method: 'PATCH',
    body: data,
  })
}
