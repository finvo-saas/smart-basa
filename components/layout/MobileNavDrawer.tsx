'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  LogOut,
  Plus,
  Sparkles,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BrandIcon } from '@/components/layout/BrandLogo'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { OwnerFocusDialog } from '@/components/onboarding'
import { cn } from '@/lib/utils'
import {
  getMobileUtilityLinksForRole,
  getPrimaryNavForRole,
  getQuickActionsForRole,
  isChildActive,
  isNavItemActive,
  useNavLabels,
} from '@/lib/navigation'
import type { NavItem } from '@/lib/navigation'
import type { UserRole } from '@/types'
import { useOwnerFocus } from '@/hooks/useOwnerFocus'
import { useMockQuery } from '@/hooks/useMockQuery'
import { OWNER_VERTICAL_META } from '@/lib/owner-focus'
import { fetchOwnerUsageStatus } from '@/lib/api/subscriptions'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { logout } from '@/utils/auth'
import { ok } from '@/lib/api/http'
import type { OwnerUsageStatus } from '@/types/subscription'

interface MobileNavDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole: UserRole
  userName: string
  isVerified?: boolean
}

function linkClass(active: boolean) {
  return cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
    active
      ? 'bg-primary/10 font-medium text-primary'
      : 'text-foreground hover:bg-accent',
  )
}

function NavSection({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate: () => void
}) {
  const { label } = useNavLabels()
  const Icon = item.icon
  const sectionActive = isNavItemActive(pathname, item)

  if (item.href && !item.children?.length) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={linkClass(sectionActive)}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" />}
        <span className="flex-1">{label(item.labelKey)}</span>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
      </Link>
    )
  }

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide',
          sectionActive ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label(item.labelKey)}
      </div>
      {item.href && (
        <Link
          href={item.href}
          onClick={onNavigate}
          className={linkClass(
            isNavItemActive(pathname, { ...item, children: undefined }),
          )}
        >
          <span className="flex-1 pl-7">{label('drawer.overview')}</span>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
        </Link>
      )}
      {item.children?.map(child => (
        <Link
          key={child.href}
          href={child.href}
          onClick={onNavigate}
          className={linkClass(isChildActive(pathname, child))}
        >
          <div className="min-w-0 flex-1 pl-7">
            <div>{label(child.labelKey)}</div>
            {child.descriptionKey && (
              <div className="truncate text-xs text-muted-foreground">
                {label(child.descriptionKey)}
              </div>
            )}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
        </Link>
      ))}
    </div>
  )
}

export function MobileNavDrawer({
  open,
  onOpenChange,
  userRole,
  userName,
  isVerified = false,
}: MobileNavDrawerProps) {
  const pathname = usePathname()
  const { label } = useNavLabels()
  const { navOptions, enabledVerticals, focusSelected } =
    useOwnerFocus()
  const ownerOpts = userRole === 'owner' ? navOptions : undefined
  const [manageFocusOpen, setManageFocusOpen] = useState(false)

  const ownerId = getCurrentAccountUserId()
  const loadUsage = useCallback(
    () =>
      userRole === 'owner' && focusSelected
        ? fetchOwnerUsageStatus(ownerId)
        : Promise.resolve(ok(null as OwnerUsageStatus | null)),
    [userRole, focusSelected, ownerId],
  )
  const { data: usage } = useMockQuery(loadUsage)

  const nearOrAtLimit = Boolean(
    usage &&
      (usage.mess.atLimit ||
        usage.mess.nearLimit ||
        usage.apartment.atLimit ||
        usage.apartment.nearLimit ||
        usage.hotel.atLimit ||
        usage.hotel.nearLimit),
  )

  const navItems = getPrimaryNavForRole(userRole, ownerOpts)
  const utilityLinks = getMobileUtilityLinksForRole(userRole).filter(
    link => link.href !== '/profile' && link.href !== '/subscription',
  )
  const quickActions = getQuickActionsForRole(userRole, ownerOpts)

  const close = () => onOpenChange(false)

  const handleLogout = async () => {
    close()
    await logout()
  }

  const openFocusEditor = () => {
    close()
    setManageFocusOpen(true)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          className="flex h-full w-[min(100vw-2rem,320px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xs sm:p-0 md:hidden"
        >
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <BrandIcon />
              {label('drawer.allMenus')}
            </SheetTitle>
            <SheetDescription asChild>
              <div className="space-y-1 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {userName}
                  </span>
                  {isVerified && (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 px-1.5 py-0 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                    >
                      <Check className="mr-0.5 h-2.5 w-2.5" />
                      {label('drawer.verified')}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {label(`roles.${userRole}`)}
                  {userRole === 'owner' && usage
                    ? ` · ${usage.planName} plan`
                    : ''}
                </p>
              </div>
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 px-3 py-4">
              {userRole === 'owner' && focusSelected && (
                <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Your business type
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {enabledVerticals[0] ? (
                      <span className="rounded-md border bg-background px-2 py-1 text-xs">
                        {OWNER_VERTICAL_META[enabledVerticals[0]].label}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={openFocusEditor}
                  >
                    Change business type
                  </Button>
                </div>
              )}

              {quickActions.length > 0 && (
                <div className="space-y-2">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {label('quickActions.title')}
                  </p>
                  <div className="grid grid-cols-2 gap-2 px-1">
                    {quickActions.map(action => (
                      <Link
                        key={action.href}
                        href={action.href}
                        onClick={close}
                        className="flex flex-col gap-1 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
                      >
                        <Plus className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium leading-tight">
                          {label(action.labelKey)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label('drawer.navigation')}
                </p>
                {navItems.map(item => (
                  <NavSection
                    key={item.labelKey}
                    item={item}
                    pathname={pathname}
                    onNavigate={close}
                  />
                ))}
              </div>

              <div className="space-y-1 border-t pt-4">
                <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Account
                </p>
                <Link
                  href="/profile"
                  onClick={close}
                  className={linkClass(pathname.startsWith('/profile'))}
                >
                  <User className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="flex-1">Profile</span>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
                </Link>
                {userRole === 'owner' && (
                  <Link
                    href="/subscription"
                    onClick={close}
                    className={linkClass(pathname.startsWith('/subscription'))}
                  >
                    <ArrowUpRight className="h-4 w-4 shrink-0 opacity-80" />
                    <span className="flex-1">
                      {nearOrAtLimit ? 'Upgrade plan' : 'Subscription'}
                    </span>
                    {nearOrAtLimit && (
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-800"
                      >
                        Limit
                      </Badge>
                    )}
                  </Link>
                )}
                {utilityLinks.map(link => {
                  const Icon = link.icon
                  const active =
                    pathname === link.href ||
                    pathname.startsWith(`${link.href}/`)

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={close}
                      className={linkClass(active)}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      <span className="flex-1">{label(link.labelKey)}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
                    </Link>
                  )
                })}
              </div>
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {userRole === 'owner' && (
        <OwnerFocusDialog
          mode="manage"
          open={manageFocusOpen}
          onOpenChange={setManageFocusOpen}
        />
      )}
    </>
  )
}
