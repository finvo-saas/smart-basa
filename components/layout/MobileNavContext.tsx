'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import {
  getDisplayName,
  getStoredRole,
  isLoggedIn,
  isOtpVerified,
} from '@/utils/auth'
import { AUTH_SESSION_CHANGED } from '@/lib/auth/session-events'
import type { UserRole } from '@/types'
import { MobileNavDrawer } from './MobileNavDrawer'

interface MobileNavContextValue {
  isOpen: boolean
  openMenu: () => void
  closeMenu: () => void
  setIsOpen: (open: boolean) => void
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null)

export function useMobileNav() {
  const context = useContext(MobileNavContext)
  if (!context) {
    throw new Error('useMobileNav must be used within MobileNavProvider')
  }
  return context
}

interface MobileNavProviderProps {
  children: ReactNode
  userRole?: UserRole
}

export function MobileNavProvider({
  children,
  userRole: userRoleProp,
}: MobileNavProviderProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>('renter')
  const [userName, setUserName] = useState('Guest')
  const [isVerified, setIsVerified] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  const syncUser = useCallback(() => {
    const logged = isLoggedIn()
    setLoggedIn(logged)
    const role = userRoleProp || getStoredRole() || 'renter'
    setUserRole(role)
    if (logged) {
      setUserName(getDisplayName())
      setIsVerified(isOtpVerified())
    } else {
      setUserName('Guest')
      setIsVerified(false)
    }
  }, [userRoleProp])

  useEffect(() => {
    setMounted(true)
    syncUser()
    window.addEventListener(AUTH_SESSION_CHANGED, syncUser)
    window.addEventListener('profile-updated', syncUser)
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED, syncUser)
      window.removeEventListener('profile-updated', syncUser)
    }
  }, [syncUser])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const openMenu = useCallback(() => setIsOpen(true), [])
  const closeMenu = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({ isOpen, openMenu, closeMenu, setIsOpen }),
    [isOpen, openMenu, closeMenu],
  )

  return (
    <MobileNavContext.Provider value={value}>
      {children}
      {mounted && loggedIn && (
        <MobileNavDrawer
          open={isOpen}
          onOpenChange={setIsOpen}
          userRole={userRole}
          userName={userName}
          isVerified={isVerified}
        />
      )}
    </MobileNavContext.Provider>
  )
}
