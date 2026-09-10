'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  FileCheck,
  AlertTriangle,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronRight,
  FileText,
  Calendar,
  ShieldAlert,
  LogOut,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard'
import { AdminRoleBadge } from '@/components/admin/AdminRoleBadge'
import {
  canAccessAdminRoute,
  ADMIN_ROLE_LABELS,
} from '@/lib/admin/permissions'
import {
  getDisplayName,
  getStoredAdminRole,
  logout,
} from '@/utils/auth'
import type { AdminRole } from '@/types/admin'
import type { AdminPermission } from '@/lib/admin/permissions'

interface AdminLayoutProps {
  children: React.ReactNode
}

const adminMenuItems: {
  title: string
  href: string
  icon: typeof LayoutDashboard
  permission?: AdminPermission
}[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    permission: 'users.view',
  },
  {
    title: 'Properties',
    href: '/admin/properties',
    icon: Building2,
    permission: 'properties.moderate',
  },
  {
    title: 'Bookings',
    href: '/admin/bookings',
    icon: Calendar,
    permission: 'bookings.view',
  },
  {
    title: 'SMS',
    href: '/admin/sms',
    icon: Smartphone,
    permission: 'sms.view',
  },
  {
    title: 'Complaints',
    href: '/admin/complaints',
    icon: MessageSquare,
    permission: 'complaints.manage',
  },
  {
    title: 'Verifications',
    href: '/admin/verifications',
    icon: FileCheck,
    permission: 'verifications.manage',
  },
  {
    title: 'Disputes',
    href: '/admin/disputes',
    icon: AlertTriangle,
    permission: 'disputes.manage',
  },
  {
    title: 'Fraud Reports',
    href: '/admin/fraud-reports',
    icon: ShieldAlert,
    permission: 'fraud.manage',
  },
  {
    title: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: FileText,
    permission: 'audit.view',
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    permission: 'analytics.view',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: 'settings.manage',
  },
]

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null)

  useEffect(() => {
    setAdminRole(getStoredAdminRole())
  }, [])

  const visibleMenuItems = adminMenuItems.filter(item => {
    if (!adminRole) return false
    return canAccessAdminRoute(adminRole, item.href)
  })

  const handleLogout = async () => {
    await logout()
    window.location.href = '/admin/login'
  }

  return (
    <Layout userRole="admin">
      <div className="flex h-[calc(100vh-4rem)]">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={cn(
            'fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4 lg:hidden">
              <h2 className="font-semibold">Admin Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <nav className="space-y-1 p-4">
                {visibleMenuItems.map(item => {
                  const Icon = item.icon
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href))

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.title}</span>
                      {isActive && (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </Link>
                  )
                })}
              </nav>
            </ScrollArea>

            <div className="space-y-2 border-t p-4">
              {adminRole && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-semibold">{getDisplayName()}</p>
                  <p className="text-xs text-muted-foreground">
                    {ADMIN_ROLE_LABELS[adminRole]}
                  </p>
                  <AdminRoleBadge role={adminRole} className="mt-2" />
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Admin logout
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b bg-background px-4 py-3 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">
                  {visibleMenuItems.find(
                    item =>
                      pathname === item.href ||
                      (item.href !== '/admin' &&
                        pathname.startsWith(item.href))
                  )?.title || 'Admin Dashboard'}
                </h1>
              </div>
            </div>
            {adminRole && (
              <AdminRoleBadge role={adminRole} className="hidden sm:flex" />
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 lg:p-6">{children}</div>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  )
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthGuard>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminAuthGuard>
  )
}
