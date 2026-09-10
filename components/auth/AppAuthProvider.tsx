'use client'

import { Suspense, useEffect, useState } from 'react'
import { RouteAuthGuard } from './RouteAuthGuard'
import { LoadingState } from '@/components/page'
import { assertNoSecretsInPublicEnv } from '@/lib/security/client-env'
import { restoreSessionFromCookie } from '@/lib/auth/restore-session'

function FullScreenLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingState label={label} className="min-h-0 py-0" />
    </div>
  )
}

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    assertNoSecretsInPublicEnv()
    let cancelled = false
    restoreSessionFromCookie().finally(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return <FullScreenLoading />
  }

  return (
    <Suspense fallback={<FullScreenLoading />}>
      <RouteAuthGuard>{children}</RouteAuthGuard>
    </Suspense>
  )
}

export { UserVerificationPanel } from './UserVerificationPanel'
export { PhoneOtpForm } from './PhoneOtpForm'
