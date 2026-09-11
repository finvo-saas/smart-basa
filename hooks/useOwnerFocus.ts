'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchCurrentUser,
  updateCurrentUser,
  type AuthUser,
} from '@/lib/api/auth'
import { AUTH_SESSION_CHANGED } from '@/lib/auth/session-events'
import {
  getStoredOwnerPrimaryFocus,
  getStoredOwnerVerticals,
  getStoredRole,
  isOwnerFocusSelected,
  syncUserDisplay,
} from '@/utils/auth'
import {
  normalizeOwnerVerticals,
  type OwnerVertical,
} from '@/lib/owner-focus'

let ownerFocusSyncPromise: Promise<void> | null = null

function syncOwnerFocusFromApiOnce(): Promise<void> {
  if (ownerFocusSyncPromise) return ownerFocusSyncPromise
  ownerFocusSyncPromise = fetchCurrentUser()
    .then(result => {
      if (result.ok) syncUserDisplay(result.data)
    })
    .finally(() => {
      // Allow a later refresh after logout/login
      setTimeout(() => {
        ownerFocusSyncPromise = null
      }, 0)
    })
  return ownerFocusSyncPromise
}

export function useOwnerFocus() {
  const [hydrated, setHydrated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [enabledVerticals, setEnabledVerticals] = useState<OwnerVertical[]>([])
  const [primaryFocus, setPrimaryFocus] = useState<OwnerVertical | ''>('')
  const [focusSelected, setFocusSelected] = useState(false)
  const [role, setRole] = useState(getStoredRole())

  const refreshFromStorage = useCallback(() => {
    setRole(getStoredRole())
    setEnabledVerticals(getStoredOwnerVerticals())
    setPrimaryFocus(getStoredOwnerPrimaryFocus())
    setFocusSelected(isOwnerFocusSelected())
  }, [])

  useEffect(() => {
    refreshFromStorage()
    setHydrated(true)
    const onChange = () => refreshFromStorage()
    window.addEventListener(AUTH_SESSION_CHANGED, onChange)
    return () => window.removeEventListener(AUTH_SESSION_CHANGED, onChange)
  }, [refreshFromStorage])

  useEffect(() => {
    if (!hydrated || role !== 'owner') return
    void syncOwnerFocusFromApiOnce().then(refreshFromStorage)
  }, [hydrated, role, refreshFromStorage])

  const needsFocusSelection =
    hydrated && role === 'owner' && !focusSelected

  const navOptions = useMemo(
    () => ({
      enabledVerticals,
      focusSelected,
    }),
    [enabledVerticals, focusSelected],
  )

  const saveFocus = useCallback(
    async (input: {
      enabledVerticals: OwnerVertical[]
      primaryFocus: OwnerVertical
    }): Promise<AuthUser | null> => {
      // Product rule: exactly one business type at a time.
      const unique = normalizeOwnerVerticals(
        input.enabledVerticals,
        input.primaryFocus,
      )
      if (unique.length === 0) return null
      const primary = unique[0]
      setSaving(true)
      try {
        const result = await updateCurrentUser({
          ownerEnabledVerticals: [primary],
          ownerPrimaryFocus: primary,
          ownerFocusSelected: true,
        })
        if (!result.ok) return null
        syncUserDisplay(result.data)
        refreshFromStorage()
        return result.data
      } finally {
        setSaving(false)
      }
    },
    [refreshFromStorage],
  )

  const hasVertical = useCallback(
    (vertical: OwnerVertical) =>
      focusSelected && enabledVerticals.includes(vertical),
    [enabledVerticals, focusSelected],
  )

  return {
    hydrated,
    role,
    enabledVerticals,
    primaryFocus,
    focusSelected,
    needsFocusSelection,
    navOptions,
    saving,
    saveFocus,
    hasVertical,
    refreshFromStorage,
  }
}
