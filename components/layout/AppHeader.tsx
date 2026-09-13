'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/components/theme/ThemeProvider'
import { LanguageSwitcher } from '@/components/i18n'
import { Button } from '@/components/ui/button'
import { NotificationBadge } from '@/components/chat/NotificationBadge'
import { NotificationsBell } from '@/components/notification/NotificationsBell'
import { SearchNotification } from '@/components/search/SearchNotification'
import { UserAccountMenu } from '@/components/layout/UserAccountMenu'
import { BrandIcon, BrandWordmark } from '@/components/layout/BrandLogo'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Moon,
  Sun,
  MessageCircle,
  Bell,
  Heart,
  Clock,
  Bookmark,
  Menu,
  ChevronRight,
} from 'lucide-react'
import {
  getDisplayName,
  getProfilePhotoUrl,
  getStoredRole,
  isLoggedIn,
  isOtpVerified,
} from '@/utils/auth'
import { AUTH_SESSION_CHANGED } from '@/lib/auth/session-events'
import type { UserRole } from '@/types'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { cn } from '@/lib/utils'

type GuestLink = {
  href: string
  labelKey:
    | 'navSearch'
    | 'navMess'
    | 'navAreas'
    | 'navUniversities'
    | 'navHotels'
    | 'navApartments'
    | 'navRoommates'
}

const GUEST_LINKS: GuestLink[] = [
  { href: '/search', labelKey: 'navSearch' },
  { href: '/search?category=mess', labelKey: 'navMess' },
  { href: '/areas', labelKey: 'navAreas' },
  { href: '/university', labelKey: 'navUniversities' },
  { href: '/search?category=hotel', labelKey: 'navHotels' },
  { href: '/search?category=apartment', labelKey: 'navApartments' },
  { href: '/roommates', labelKey: 'navRoommates' },
]

function guestLinkActive(pathname: string, href: string, search: string) {
  const [path, query = ''] = href.split('?')
  if (path === '/search') {
    if (pathname !== '/search') return false
    const wanted = new URLSearchParams(query).get('category') || 'all'
    const current = new URLSearchParams(search).get('category') || 'all'
    return current === wanted
  }
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function AppHeader() {
  const t = useTranslations('layout')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const { theme, toggle: toggleTheme } = useTheme()
  const [userName, setUserName] = useState('Guest')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [guestMenuOpen, setGuestMenuOpen] = useState(false)

  useEffect(() => {
    const syncUser = () => {
      const logged = isLoggedIn()
      setLoggedIn(logged)
      setRole(getStoredRole())
      if (logged) {
        setUserName(getDisplayName())
        setPhotoUrl(getProfilePhotoUrl())
        setIsVerified(isOtpVerified())
      }
    }

    setMounted(true)
    syncUser()

    window.addEventListener(AUTH_SESSION_CHANGED, syncUser)
    window.addEventListener('profile-updated', syncUser)
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED, syncUser)
      window.removeEventListener('profile-updated', syncUser)
    }
  }, [])

  useEffect(() => {
    setGuestMenuOpen(false)
  }, [pathname])

  const userId = getCurrentAccountUserId()
  const isGuest = mounted && !(loggedIn && role)

  const themeButton = (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 shrink-0 md:h-10 md:w-10"
      aria-label={t('toggleTheme')}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 md:h-5 md:w-5" />
      ) : (
        <Moon className="h-4 w-4 md:h-5 md:w-5" />
      )}
    </Button>
  )

  const messagesButton = (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className="relative h-9 w-9 shrink-0 md:h-10 md:w-10"
      title={t('messages')}
    >
      <Link href="/messages">
        <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
        <NotificationBadge userId={userId} />
      </Link>
    </Button>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-14 min-w-0 items-center justify-between gap-1.5 sm:gap-2">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-1.5 sm:gap-2"
            aria-label="SmartBasa home"
          >
            <BrandIcon className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" priority />
            <BrandWordmark className="h-3.5 max-w-[5.75rem] min-[360px]:max-w-[7.5rem] sm:h-5 sm:max-w-none" />
          </Link>

          {/* Desktop / large tablet guest + auth actions */}
          <div className="hidden items-center gap-1 lg:flex lg:gap-2">
            {!mounted ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : loggedIn && role ? (
              <>
                <SearchNotification userId={userId} />
                {role === 'renter' && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title={t('favorites')}
                    >
                      <Link href="/favorites">
                        <Heart className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title={t('searchHistory')}
                    >
                      <Link href="/search-history">
                        <Clock className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title={t('savedSearches')}
                    >
                      <Link href="/saved-searches">
                        <Bookmark className="h-5 w-5" />
                      </Link>
                    </Button>
                  </>
                )}
                {role === 'owner' && (
                  <Button variant="ghost" size="icon" asChild title={t('notices')}>
                    <Link href="/notices">
                      <Bell className="h-5 w-5" />
                    </Link>
                  </Button>
                )}
                {messagesButton}
                <NotificationsBell />
                {themeButton}
                <LanguageSwitcher variant="ghost" size="sm" />
                <UserAccountMenu
                  userName={userName}
                  isVerified={isVerified}
                  role={role}
                  photoUrl={photoUrl}
                  showName
                  className="px-1"
                />
              </>
            ) : (
              <>
                {GUEST_LINKS.map(link => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    size="sm"
                    asChild
                    className={cn(
                      guestLinkActive(pathname, link.href, search) &&
                        'bg-accent text-accent-foreground'
                    )}
                  >
                    <Link href={link.href}>{t(link.labelKey)}</Link>
                  </Button>
                ))}
                <Button size="sm" asChild>
                  <Link href="/login">{t('login')}</Link>
                </Button>
                <LanguageSwitcher variant="ghost" size="sm" />
                {themeButton}
              </>
            )}
          </div>

          {/* Compact header (< lg): full guest menu via sheet */}
          <div className="flex min-w-0 shrink-0 items-center gap-0 lg:hidden">
            {!mounted ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : loggedIn && role ? (
              <>
                <div className="hidden min-[380px]:contents">
                  <SearchNotification userId={userId} />
                  {role === 'owner' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-9 w-9 shrink-0"
                      title="Notices"
                    >
                      <Link href="/notices">
                        <Bell className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
                {messagesButton}
                <NotificationsBell />
                {themeButton}
                <LanguageSwitcher
                  variant="ghost"
                  size="icon"
                  showLabel={false}
                  className="h-9 w-9"
                />
                <UserAccountMenu
                  userName={userName}
                  isVerified={isVerified}
                  role={role}
                  photoUrl={photoUrl}
                />
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  asChild
                  className="h-9 shrink-0 px-2.5 text-xs min-[360px]:px-3 min-[360px]:text-sm"
                >
                  <Link href="/login">{t('login')}</Link>
                </Button>
                <LanguageSwitcher
                  variant="ghost"
                  size="icon"
                  showLabel={false}
                  className="h-9 w-9"
                />
                {themeButton}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label={t('openMenu')}
                  aria-expanded={guestMenuOpen}
                  onClick={() => setGuestMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Guest browse menu — all links reachable on small screens */}
      {isGuest && (
        <Sheet open={guestMenuOpen} onOpenChange={setGuestMenuOpen}>
          <SheetContent
            side="right"
            className="flex w-[min(100vw-2.5rem,20rem)] flex-col gap-0 p-0 lg:hidden"
          >
            <SheetHeader className="border-b px-5 py-4 text-left">
              <SheetTitle className="text-base">{t('browseMenu')}</SheetTitle>
              <SheetDescription className="text-xs">
                {t('browseMenuHint')}
              </SheetDescription>
            </SheetHeader>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
              {GUEST_LINKS.map(link => {
                const active = guestLinkActive(pathname, link.href, search)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setGuestMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                      active
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    <span className="flex-1">{t(link.labelKey)}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
                  </Link>
                )
              })}
            </nav>
            <div className="border-t p-4">
              <Button asChild className="w-full">
                <Link href="/login" onClick={() => setGuestMenuOpen(false)}>
                  {t('login')}
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </header>
  )
}
