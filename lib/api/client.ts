/**
 * HTTP client for SmartBasa API.
 * Parses ApiResult envelope; attaches JWT; refreshes on 401 via httpOnly cookie.
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
    if (raw) return raw.replace(/\/$/, '')
    return DEFAULT_API_BASE
  }

  const raw = process.env.NEXT_PUBLIC_API_URL?.trim()
  // Relative path → same-origin Next rewrite (local / optional fallback)
  if (!raw || raw.startsWith('/')) {
    return (raw || '/api/v1').replace(/\/$/, '')
  }
  // Absolute URL (e.g. https://api.smartbasa.com/api/v1) — cross-subdomain OK
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

/** One in-flight refresh — prevents rotate/blacklist races (400 then 200 pairs). */
let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight
  }

  // Do not resurrect a session while logout is in progress / just completed.
  const { isLogoutGuardActive } = await import('@/lib/auth/session-events')
  if (isLogoutGuardActive()) {
    clearAuthTokens()
    return false
  }

  refreshInFlight = (async () => {
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
      const result = await parseEnvelope<{
        access: string
        refresh?: string
        user?: { id: string }
      }>(response)
      if (!result.ok) {
        clearAuthTokens()
        return false
      }
      if (isLogoutGuardActive()) {
        clearAuthTokens()
        return false
      }
      setAuthTokens({
        access: result.data.access,
        refresh: result.data.refresh,
        userId: result.data.user?.id,
      })
      return true
    } catch {
      clearAuthTokens()
      return false
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
  }

  return parseEnvelope<T>(response)
}
