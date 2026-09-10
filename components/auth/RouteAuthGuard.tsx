'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  getDefaultPathForRole,
  isAdminPath,
  isAdminPublicPath,
  isAuthFlowPath,
  isProtectedPath,
  isPublicPath,
  isRoleAllowed,
} from '@/lib/auth'
import { AUTH_SESSION_CHANGED } from '@/lib/auth/session-events'
import {
  getLoginPhone,
  getStoredRole,
  hasCompleteSession,
  isAdminSession,
  isLoggedIn,
  isOtpVerified,
  isPinResetFlow,
  needsPinSetup,
} from '@/utils/auth'
import { hasAuthTokens } from '@/utils/auth-tokens'
import { LoadingState } from '@/components/page'
import { AccessDenied } from './AccessDenied'

type GuardState = 'loading' | 'ready' | 'denied'

export function RouteAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<GuardState>('loading')

  useEffect(() => {
    const evaluate = () => {
      const next = searchParams.get('next') || pathname
      const role = getStoredRole()
      const pinNeeded = needsPinSetup()
      const pinReset = isPinResetFlow()
      const authed = isOtpVerified() && hasAuthTokens()

      const finish = (nextState: GuardState) => setState(nextState)
      const redirect = (href: string) => {
        setState('loading')
        router.replace(href)
      }

      if (isAdminPath(pathname) && !isAdminPublicPath(pathname)) {
        if (pinNeeded && authed) {
          redirect('/set-pin')
          return
        }
        if (!isAdminSession()) {
          redirect(`/admin/login?next=${encodeURIComponent(pathname)}`)
          return
        }
        finish('ready')
        return
      }

      if (isAuthFlowPath(pathname)) {
        if (pathname === '/login' && hasCompleteSession()) {
          redirect(getDefaultPathForRole(role ?? 'renter'))
          return
        }
        if (pathname === '/otp-verify' && !getLoginPhone()) {
          redirect('/login')
          return
        }
        if (pathname === '/otp-verify' && hasCompleteSession()) {
          redirect(getDefaultPathForRole(role ?? 'renter'))
          return
        }
        if (pathname === '/set-pin') {
          if (!authed) {
            redirect('/login')
            return
          }
          if (!pinNeeded && !pinReset && hasCompleteSession()) {
            redirect(getDefaultPathForRole(role ?? 'renter'))
            return
          }
          if (!pinNeeded && !pinReset) {
            redirect('/role-selection')
            return
          }
        }
        if (pathname === '/role-selection') {
          if (!authed) {
            redirect('/login')
            return
          }
          if (pinNeeded || pinReset) {
            redirect('/set-pin')
            return
          }
          if (isLoggedIn() && hasCompleteSession()) {
            redirect(getDefaultPathForRole(role ?? 'renter'))
            return
          }
        }
        finish('ready')
        return
      }

      if (pathname === '/account/change-phone' && !isLoggedIn()) {
        redirect(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }

      if (/^\/hotels\/[^/]+\/book/.test(pathname) && !isLoggedIn()) {
        redirect(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }

      if (isProtectedPath(pathname) && !isPublicPath(pathname)) {
        if (!isLoggedIn() || !isOtpVerified()) {
          if (authed && pinNeeded) {
            redirect('/set-pin')
            return
          }
          if (authed && !hasCompleteSession()) {
            redirect('/role-selection')
            return
          }
          redirect(`/login?next=${encodeURIComponent(next)}`)
          return
        }
        if (pinNeeded && pathname !== '/set-pin') {
          redirect('/set-pin')
          return
        }
        if (!hasCompleteSession() && pathname !== '/role-selection') {
          redirect('/role-selection')
          return
        }

        if (role && !isRoleAllowed(pathname, role)) {
          finish('denied')
          return
        }
      }

      finish('ready')
    }

    evaluate()
    window.addEventListener(AUTH_SESSION_CHANGED, evaluate)
    return () => window.removeEventListener(AUTH_SESSION_CHANGED, evaluate)
  }, [pathname, router, searchParams])

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState label="Loading..." className="min-h-0 py-0" />
      </div>
    )
  }

  if (state === 'denied') {
    return <AccessDenied role={getStoredRole()} />
  }

  return <>{children}</>
}
