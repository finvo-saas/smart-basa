/**
 * HTTP client for SmartBasa API.
 * Parses ApiResult envelope; attaches JWT; refreshes on 401 via cookie and/or body refresh.
 */

import {
  err,
  type ApiErrorCode,
  type ApiResult,
} from './http'
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from '@/utils/auth-tokens'

const DEFAULT_API_BASE = 'http://127.0.0.1:8000/api/v1'

export function getApiBaseUrl(): string {
  // SSR: prefer Docker-internal URL so server components skip the public hop
  if (typeof window === 'undefined') {
    const internal = process.env.API_INTERNAL_URL?.trim()
    if (internal) return internal.replace(/\/$/, '')
    const raw = process.env.NEXT_PUBLIC_API_URL?.trim()
    // Relative browser path is not valid for Node fetch — hit Django directly.
    if (raw && !raw.startsWith('/')) return raw.replace(/\/$/, '')
    return DEFAULT_API_BASE
  }

  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()
  // Relative path → same-origin Next rewrite (keeps refresh cookie first-party)
  if (!raw || raw.startsWith('/')) {
    return (raw || '/api/v1').replace(/\/$/, '')
  }
  // Loopback host mismatch (localhost vs 127.0.0.1) breaks the refresh cookie.
  try {
    const apiHost = new URL(raw).hostname
    const pageHost = window.location.hostname
    const loopback = new Set(['localhost', '127.0.0.1'])
    if (
      loopback.has(pageHost) &&
      loopback.has(apiHost) &&
      pageHost !== apiHost
    ) {
      return '/api/v1'
    }
  } catch {
    /* fall through */
  }
  // Absolute URL (e.g. https://api.smartbasa.com/api/v1)
  return raw.replace(/\/$/, '')
}

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
  formData?: FormData
  headers?: Record<string, string>
  /** Skip refresh retry (internal) */
  _retry?: boolean
}

function mapStatusToCode(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 404) return 'NOT_FOUND'
  if (status === 403) return 'FORBIDDEN'
  if (status === 409) return 'CONFLICT'
  if (status === 400 || status === 422) return 'INVALID'
  if (status === 501) return 'GATEWAY_TODO'
  return 'UNKNOWN'
}

async function parseEnvelope<T>(response: Response): Promise<ApiResult<T>> {
  let json: unknown
  try {
    json = await response.json()
  } catch {
    return err(
      response.ok ? 'Empty response' : `HTTP ${response.status}`,
      mapStatusToCode(response.status),
    )
  }

  if (
    json &&
    typeof json === 'object' &&
    'ok' in json &&
    (json as { ok: boolean }).ok === true &&
    'data' in json
  ) {
    return { ok: true, data: (json as { data: T }).data }
  }

  if (
    json &&
    typeof json === 'object' &&
    'ok' in json &&
    (json as { ok: boolean }).ok === false
  ) {
    const body = json as { error?: string; code?: ApiErrorCode }
    return err(
      body.error || `Request failed (${response.status})`,
      body.code || mapStatusToCode(response.status),
    )
  }

  if (response.ok) {
    return { ok: true, data: json as T }
  }

  return err(`HTTP ${response.status}`, mapStatusToCode(response.status))
}

function withTrailingSlash(url: string): string {
  const hashIndex = url.indexOf('#')
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : ''
  const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url
  const qIndex = withoutHash.indexOf('?')
  const path = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash
  const query = qIndex >= 0 ? withoutHash.slice(qIndex) : ''
  if (path.endsWith('/')) return `${path}${query}${hash}`
  return `${path}/${query}${hash}`
}

/** One in-flight refresh — prevents rotate/blacklist races. */
let refreshInFlight: Promise<boolean> | null = null

/**
 * Definitive auth failure only (invalid/missing refresh).
 * Does NOT set the logout guard — that is reserved for explicit logout so a
 * later visit can still restore if the httpOnly cookie is valid.
 */
async function markSessionExpired(): Promise<void> {
  const { clearLocalAuthState } = await import('@/utils/auth')
  const {
    notifyAuthSessionChanged,
    isLogoutGuardActive,
  } = await import('@/lib/auth/session-events')

  if (isLogoutGuardActive()) {
    clearAuthTokens()
    return
  }

  clearLocalAuthState()
  notifyAuthSessionChanged()
}

type RefreshAttempt = {
  networkError: boolean
  result: ApiResult<{
    access: string
    refresh?: string
    user?: { id: string }
  }> | null
}

async function attemptRefresh(): Promise<RefreshAttempt> {
  const refresh = getRefreshToken()
  try {
    const response = await fetch(
      withTrailingSlash(`${getApiBaseUrl()}/auth/token/refresh/`),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(refresh ? { refresh } : {}),
      },
    )
    return {
      networkError: false,
      result: await parseEnvelope<{
        access: string
        refresh?: string
        user?: { id: string }
      }>(response),
    }
  } catch {
    return { networkError: true, result: null }
  }
}

/** Shared refresh used by API 401 retry and cold-start restore. */
export async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight
  }

  const { isLogoutGuardActive } = await import('@/lib/auth/session-events')
  if (isLogoutGuardActive()) {
    clearAuthTokens()
    return false
  }

  refreshInFlight = (async () => {
    try {
      let attempt = await attemptRefresh()

      // Network blip — keep the local session; caller can retry later.
      if (attempt.networkError) {
        return false
      }

      // Rotation race (multi-tab): wait briefly and retry once.
      if (!attempt.result?.ok) {
        await new Promise(resolve => setTimeout(resolve, 400))
        attempt = await attemptRefresh()
        if (attempt.networkError) {
          return false
        }
      }

      if (!attempt.result?.ok) {
        await markSessionExpired()
        return false
      }

      if (isLogoutGuardActive()) {
        clearAuthTokens()
        return false
      }

      setAuthTokens({
        access: attempt.result.data.access,
        refresh: attempt.result.data.refresh,
        userId: attempt.result.data.user?.id,
      })
      return true
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const {
    method = 'GET',
    body,
    auth = true,
    formData,
    headers: extraHeaders = {},
    _retry = false,
  } = options

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extraHeaders,
  }

  if (!formData) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const access = getAccessToken()
    if (access) {
      headers.Authorization = `Bearer ${access}`
    }
  }

  const url = withTrailingSlash(
    path.startsWith('http')
      ? path
      : `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`,
  )

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: formData
        ? formData
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    })
  } catch {
    return err('Unable to reach the API. Is the backend running?', 'UNKNOWN')
  }

  if (response.status === 401 && auth && !_retry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _retry: true })
    }
    // Still signed in locally (network blip) — surface a soft error.
    const { isLoggedIn } = await import('@/utils/auth')
    if (isLoggedIn()) {
      return err('Unable to refresh session. Please try again.', 'UNAUTHORIZED')
    }
    return err('Session expired. Sign in again.', 'UNAUTHORIZED')
  }

  return parseEnvelope<T>(response)
}
