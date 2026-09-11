/**
 * Shared ApiResult helpers.
 * Real HTTP lives in `lib/api/client.ts`; domain modules return ApiResult<T>.
 *
 * mockDelay is a no-op unless NEXT_PUBLIC_USE_MOCK_DELAY=true
 * (legacy offline mocks — leave unset in normal API mode).
 */

export const MOCK_API_DELAY_MS = Number(
  process.env.NEXT_PUBLIC_MOCK_API_DELAY_MS || '320',
)

export async function mockDelay(ms: number = MOCK_API_DELAY_MS): Promise<void> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DELAY !== 'true') return
  await new Promise(resolve => setTimeout(resolve, ms))
}

export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CIMS_REQUIRED'
  | 'INVALID'
  | 'INVALID_ACCOUNT'
  | 'UNAUTHORIZED'
  | 'GATEWAY_TODO'
  | 'UNAVAILABLE'
  | 'UNPUBLISHED'
  | 'CONFLICT'
  | 'INVALID_STATE'
  | 'REASON_REQUIRED'
  | 'UNKNOWN'

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: ApiErrorCode }

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data }
}

export function err(
  error: string,
  code: ApiErrorCode = 'UNKNOWN'
): ApiResult<never> {
  return { ok: false, error, code }
}

export function isApiError<T>(
  result: ApiResult<T>
): result is { ok: false; error: string; code?: ApiErrorCode } {
  return !result.ok
}

/** Throws on failure — use in server actions or after explicit checks. */
export function unwrapApiResult<T>(result: ApiResult<T>): T {
  if (!result.ok) throw new Error(result.error)
  return result.data
}
