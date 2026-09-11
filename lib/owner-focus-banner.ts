import { authStorageGet, authStorageSet } from '@/utils/auth-storage'
import { getStoredUserId } from '@/utils/auth-tokens'

function dismissKey(): string {
  const userId = getStoredUserId() || 'anon'
  return `ownerBusinessFocusIntroDismissed:${userId}`
}

/** One-time dashboard intro for “Your business type”. */
export function isBusinessFocusIntroDismissed(): boolean {
  return authStorageGet(dismissKey()) === '1'
}

export function dismissBusinessFocusIntro(): void {
  authStorageSet(dismissKey(), '1')
}
