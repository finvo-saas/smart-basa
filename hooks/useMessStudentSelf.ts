'use client'

import { useCallback, useMemo } from 'react'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { fetchMyMessMemberships } from '@/lib/api/mess'
import { useMockQuery } from '@/hooks/useMockQuery'
import type { Student } from '@/types/mess'

/**
 * The signed-in renter's own mess record.
 *
 * Uses ``/mess/me/memberships/`` so we never probe every public mess roster
 * (which 403s for messes the renter does not belong to).
 */
export function useMessStudentSelf(): {
  student: Student | undefined
  memberships: Student[]
  loading: boolean
} {
  const userId = getCurrentAccountUserId()
  const loadMemberships = useCallback(() => fetchMyMessMemberships(), [])
  const { data: memberships, loading } = useMockQuery(loadMemberships)

  const list = memberships ?? []

  const student = useMemo(() => {
    if (!list.length) return undefined
    // Prefer a seated membership for the dashboard home card.
    const seated = list.find(s => Boolean(s.seatNumber))
    if (seated) return seated
    if (userId) {
      const linked = list.find(s => s.userId && s.userId === userId)
      if (linked) return linked
    }
    return list[0]
  }, [list, userId])

  return { student, memberships: list, loading }
}
