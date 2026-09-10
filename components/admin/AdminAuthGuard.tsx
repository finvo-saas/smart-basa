'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getStoredAdminRole,
  getStoredRole,
  isLoggedIn,
} from '@/utils/auth'
import { hasAuthTokens } from '@/utils/auth-tokens'
import { canAccessAdminRoute } from '@/lib/admin/permissions'
import { LoadingState } from '@/components/page'

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    const loggedIn = isLoggedIn()
    const role = getStoredRole()
    const adminRole = getStoredAdminRole()
    const hasJwt = hasAuthTokens()

    // Session flags alone are not enough — admin APIs require JWT.
    if (!loggedIn || role !== 'admin' || !adminRole || !hasJwt) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    if (!canAccessAdminRoute(adminRole, pathname)) {
      setDenied(true)
      setReady(true)
      return
    }

    setDenied(false)
    setReady(true)
  }, [pathname, router])

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingState label="Verifying admin access..." className="min-h-0 py-0" />
      </div>
    )
  }

  if (denied) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <div>
          <h2 className="text-lg font-semibold">Access denied</h2>
          <p className="text-sm text-muted-foreground">
            Your admin role does not have permission for this page.
          </p>
        </div>
        <Button onClick={() => router.push('/admin')}>Back to dashboard</Button>
      </div>
    )
  }

  return <>{children}</>
}
