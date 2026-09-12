import type { AdminRole } from '@/types/admin'

export type AdminPermission =
  | 'dashboard.view'
  | 'users.view'
  | 'users.manage'
  | 'users.ban'
  | 'properties.moderate'
  | 'bookings.view'
  | 'bookings.manage'
  | 'complaints.manage'
  | 'verifications.manage'
  | 'disputes.manage'
  | 'fraud.manage'
  | 'analytics.view'
  | 'settings.manage'
  | 'audit.view'
  | 'sms.view'
  | 'sms.manage'

const ALL_PERMISSIONS: AdminPermission[] = [
  'dashboard.view',
  'users.view',
  'users.manage',
  'users.ban',
  'properties.moderate',
  'bookings.view',
  'bookings.manage',
  'complaints.manage',
  'verifications.manage',
  'disputes.manage',
  'fraud.manage',
  'analytics.view',
  'settings.manage',
  'audit.view',
  'sms.view',
  'sms.manage',
]

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  'super-admin': ALL_PERMISSIONS,
  moderator: ALL_PERMISSIONS.filter(
    p => p !== 'settings.manage' && p !== 'users.ban'
  ),
  support: [
    'dashboard.view',
    'complaints.manage',
    'verifications.manage',
    'disputes.manage',
    'bookings.view',
    'fraud.manage',
    'sms.view',
  ],
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  'super-admin': 'Super Admin',
  moderator: 'Moderator',
  support: 'Support',
}

/** Registered platform admin phones → sub-role (digits only, no +) */
export const DEMO_ADMIN_PHONES: Record<string, AdminRole> = {
  '8801934856451': 'super-admin',
}

export function getAdminRoleForPhone(phone: string): AdminRole | null {
  const normalized = phone.replace(/\D/g, '')
  return DEMO_ADMIN_PHONES[normalized] ?? null
}

export function hasAdminPermission(
  role: AdminRole | null,
  permission: AdminPermission
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function canAccessAdminRoute(
  role: AdminRole | null,
  href: string
): boolean {
  if (!role) return false

  const routePermissions: { prefix: string; permission: AdminPermission }[] = [
    { prefix: '/admin/settings', permission: 'settings.manage' },
    { prefix: '/admin/audit-logs', permission: 'audit.view' },
    { prefix: '/admin/analytics', permission: 'analytics.view' },
    { prefix: '/admin/sms', permission: 'sms.view' },
    { prefix: '/admin/users', permission: 'users.view' },
    { prefix: '/admin/properties', permission: 'properties.moderate' },
    { prefix: '/admin/bookings', permission: 'bookings.view' },
    { prefix: '/admin/complaints', permission: 'complaints.manage' },
    { prefix: '/admin/verifications', permission: 'verifications.manage' },
    { prefix: '/admin/disputes', permission: 'disputes.manage' },
    { prefix: '/admin/fraud-reports', permission: 'fraud.manage' },
    { prefix: '/admin', permission: 'dashboard.view' },
  ]

  const match = routePermissions.find(r => href.startsWith(r.prefix))
  if (!match) return hasAdminPermission(role, 'dashboard.view')
  return hasAdminPermission(role, match.permission)
}
