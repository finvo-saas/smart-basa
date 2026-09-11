/**
 * Auth persistence across reloads and tab closes until explicit logout.
 * Migrates legacy sessionStorage values once so existing tabs keep working.
 */

export function authStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  let value = localStorage.getItem(key)
  if (value == null) {
    value = sessionStorage.getItem(key)
    if (value != null) {
      localStorage.setItem(key, value)
      sessionStorage.removeItem(key)
    }
  }
  return value
}

export function authStorageSet(key: string, value: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, value)
  sessionStorage.removeItem(key)
}

export function authStorageRemove(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}
