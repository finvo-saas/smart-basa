'use client'

import { ReactNode, Suspense, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AppHeader } from './AppHeader'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { BottomNavigation } from './BottomNavigation'
import { MobileNavProvider } from './MobileNavContext'
import { OfflineBanner } from '@/components/feedback'
import { SkipToContent } from '@/components/a11y'
import { InstallPrompt } from '@/components/pwa'
import { InstallCapture } from '@/components/pwa/InstallCapture'
import { PushRegistrar } from '@/components/pwa/PushRegistrar'
import { ServiceWorkerRegistrar } from '@/components/pwa/ServiceWorkerRegistrar'
import { isPrivatePath } from '@/lib/seo/routes'
import { getStoredRole, isLoggedIn } from '@/utils/auth'
import { UserRole } from '@/types'

interface LayoutProps {
  children: ReactNode
  userRole?: UserRole
}

export const Layout = ({ children, userRole }: LayoutProps) => {
  const pathname = usePathname()
  const [currentRole, setCurrentRole] = useState<UserRole>('renter')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedRole = userRole || getStoredRole()
    if (storedRole) {
      setCurrentRole(storedRole)
    }
  }, [userRole])

  const isUserLoggedIn = mounted && isLoggedIn()
  const dashboardView = isPrivatePath(pathname || '/')

  return (
    <MobileNavProvider userRole={currentRole}>
      <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-background transition-colors duration-200">
        <SkipToContent />
        <OfflineBanner />
        <Suspense fallback={<div className="h-14 border-b border-border bg-background" />}>
          <AppHeader />
        </Suspense>
        {isUserLoggedIn && (
          <div className="hidden md:block">
            <Navbar userRole={currentRole} />
          </div>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className={
            isUserLoggedIn
              ? 'min-w-0 flex-grow pb-16 outline-none md:pb-0'
              : 'min-w-0 flex-grow outline-none'
          }
        >
          {children}
        </main>
        <div className={dashboardView ? 'hidden md:block' : undefined}>
          <Footer />
        </div>
        {isUserLoggedIn && (
          <div className="md:hidden">
            <BottomNavigation userRole={currentRole} />
          </div>
        )}
        {isUserLoggedIn && <PushRegistrar />}
        <ServiceWorkerRegistrar />
        <InstallCapture />
        <InstallPrompt />
      </div>
    </MobileNavProvider>
  )
}
