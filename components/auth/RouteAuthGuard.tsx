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
import { AUTH_SESSION_CHANGED, isLogoutGuardActive } from '@/lib/auth/session-events'
import {
  consumeAuthReturn,
  getLoginPhone,
  getStoredRole,
  hasCompleteSession,
  isAdminSession,
  isLoggedIn,
  isOtpVerified,
  isPinResetFlow,
  needsPinSetup,
  peekAuthReturn,
} from '@/utils/auth'
import { peekPendingSavedSearch } from '@/lib/search/pendingSavedSearch'
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
    const evaluate = (fromSessionChange = false) => {
      const next = searchParams.get('next') || pathname
      const afterAuth = () => {
        const back = peekAuthReturn()
        if (back) consumeAuthReturn()
        return back || getDefaultPathForRole(role ?? 'renter')
      }
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
          if (fromSessionChange) {
            finish('ready')
            return
          }
          redirect(afterAuth())
          return
        }
        if (pathname === '/otp-verify' && !getLoginPhone()) {
          redirect('/login')
          return
        }
        if (pathname === '/otp-verify' && hasCompleteSession()) {
          if (fromSessionChange) {
            finish('ready')
            return
          }
          redirect(afterAuth())
          return
        }
        if (pathname === '/set-pin') {
          if (!authed) {
            redirect('/login')
            return
          }
          if (!pinNeeded && !pinReset && hasCompleteSession()) {
            if (fromSessionChange) {
              finish('ready')
              return
            }
            redirect(afterAuth())
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
            if (fromSessionChange) {
              finish('ready')
              return
            }
            redirect(afterAuth())
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
          // During logout, stay on home. Do not send the user to login.
          if (fromSessionChange && isLogoutGuardActive()) {
            redirect('/')
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

      if (
        hasCompleteSession() &&
        peekPendingSavedSearch() &&
        pathname !== '/saved-searches' &&
        !isAuthFlowPath(pathname)
      ) {
        redirect('/saved-searches')
        return
      }

      finish('ready')
    }

    evaluate()
    const onSession = () => evaluate(true)
    window.addEventListener(AUTH_SESSION_CHANGED, onSession)
    return () => window.removeEventListener(AUTH_SESSION_CHANGED, onSession)
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
