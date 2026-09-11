import type { UserRole } from '@/types'
import {
  defaultPathForOwnerFocus,
  type OwnerVertical,
} from '@/lib/owner-focus'
import {
  getStoredOwnerPrimaryFocus,
  getStoredOwnerVerticals,
  isOwnerFocusSelected,
} from '@/utils/auth'

type RoleRule = {
  /** Path prefix match */
  prefix: string
  roles: readonly UserRole[]
  /** If true, only matches when path equals prefix exactly */
  exact?: boolean
}

/**
 * Role-specific route rules (first match wins).
 * `null` from resolver = any authenticated role may access.
 */
const ROLE_RULES: RoleRule[] = [
  { prefix: '/mess/student-dashboard', roles: ['renter'] },
  { prefix: '/rentals', roles: ['renter'] },
  { prefix: '/favorites', roles: ['renter'] },
  { prefix: '/my-properties', roles: ['owner'] },
  { prefix: '/my-listings', roles: ['owner'] },
  { prefix: '/my-hotels', roles: ['owner'] },
  { prefix: '/mess', roles: ['owner'] },
  { prefix: '/admin', roles: ['admin'] },
]

/** Mess sub-routes renters may open (view/accept rules for their home). */
const MESS_RENTER_SHARED =
  /^\/mess\/[^/]+\/rules(?:\/|$)/

export function getRequiredRoles(pathname: string): UserRole[] | null {
  if (MESS_RENTER_SHARED.test(pathname)) {
    return ['owner', 'renter']
  }
  for (const rule of ROLE_RULES) {
    const matches = rule.exact
      ? pathname === rule.prefix
      : pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
    if (matches) return [...rule.roles]
  }
  return null
}

export function isRoleAllowed(
  pathname: string,
  userRole: UserRole | null
): boolean {
  if (!userRole) return false
  const required = getRequiredRoles(pathname)
  if (!required) return true
  return required.includes(userRole)
}

/** Default landing when role cannot access a path */
export function getDefaultPathForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'owner': {
      if (typeof window !== 'undefined' && isOwnerFocusSelected()) {
        return defaultPathForOwnerFocus(
          getStoredOwnerPrimaryFocus() as OwnerVertical | '',
          getStoredOwnerVerticals(),
        )
      }
      return '/dashboard'
    }
    case 'renter':
    default:
      return '/dashboard'
  }
}
