'use client'

import { ReactNode, useEffect, useState } from 'react'
import { AppHeader } from './AppHeader'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { BottomNavigation } from './BottomNavigation'
import { MobileNavProvider } from './MobileNavContext'
import { OfflineBanner } from '@/components/feedback'
import { SkipToContent } from '@/components/a11y'
import { InstallPrompt } from '@/components/pwa'
import { PushRegistrar } from '@/components/pwa/PushRegistrar'
import { ServiceWorkerRegistrar } from '@/components/pwa/ServiceWorkerRegistrar'
import { getStoredRole, isLoggedIn } from '@/utils/auth'
import { UserRole } from '@/types'

interface LayoutProps {
  children: ReactNode
  userRole?: UserRole
}

export const Layout = ({ children, userRole }: LayoutProps) => {
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

  return (
    <MobileNavProvider userRole={currentRole}>
      <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-background transition-colors duration-200">
        <SkipToContent />
        <OfflineBanner />
        <AppHeader />
        {isUserLoggedIn && (
          <div className="hidden md:block">
            <Navbar userRole={currentRole} />
          </div>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-grow pb-16 outline-none md:pb-0"
        >
          {children}
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
        {isUserLoggedIn && (
          <div className="md:hidden">
            <BottomNavigation userRole={currentRole} />
          </div>
        )}
        {isUserLoggedIn && <PushRegistrar />}
        <ServiceWorkerRegistrar />
        <InstallPrompt />
      </div>
    </MobileNavProvider>
  )
}
