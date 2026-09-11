'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Check,
  LogOut,
  Sparkles,
  User,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { OwnerFocusDialog } from '@/components/onboarding'
import { logout } from '@/utils/auth'
import { useOwnerFocus } from '@/hooks/useOwnerFocus'
import { useMockQuery } from '@/hooks/useMockQuery'
import { ownerRoleLabel, OWNER_VERTICAL_META } from '@/lib/owner-focus'
import { fetchOwnerUsageStatus } from '@/lib/api/subscriptions'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { ok } from '@/lib/api/http'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'
import type { OwnerUsageStatus } from '@/types/subscription'

const roleLabels: Record<UserRole, string> = {
  renter: 'Renter',
  owner: 'Property owner',
  admin: 'Administrator',
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface UserAccountMenuProps {
  userName: string
  isVerified?: boolean
  role: UserRole
  photoUrl?: string | null
  /** Show name beside avatar (desktop) */
  showName?: boolean
  className?: string
}

export function UserAccountMenu({
  userName,
  isVerified = false,
  role,
  photoUrl,
  showName = false,
  className,
}: UserAccountMenuProps) {
  const initials = getInitials(userName)
  const { enabledVerticals, primaryFocus, focusSelected } = useOwnerFocus()
  const roleLabel =
    role === 'owner'
      ? ownerRoleLabel(primaryFocus, enabledVerticals, focusSelected)
      : roleLabels[role]

  const [manageFocusOpen, setManageFocusOpen] = useState(false)

  const ownerId = getCurrentAccountUserId()
  const loadUsage = useCallback(
    () =>
      role === 'owner' && focusSelected
        ? fetchOwnerUsageStatus(ownerId)
        : Promise.resolve(ok(null as OwnerUsageStatus | null)),
    [role, focusSelected, ownerId],
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

  const focusSummary =
    role === 'owner' && focusSelected && enabledVerticals.length > 0
      ? enabledVerticals.map(v => OWNER_VERTICAL_META[v].label).join(' · ')
      : null

  const handleLogout = async () => {
    await logout()
    window.location.assign('/')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-full outline-none ring-offset-background transition-colors',
              'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              className,
            )}
            aria-label="Account menu"
          >
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={photoUrl ?? undefined} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            {showName && (
              <span className="max-w-[8rem] truncate text-sm font-medium">
                {userName}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium">{userName}</span>
                {isVerified && (
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 px-1.5 py-0 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                  >
                    <Check className="mr-0.5 h-2.5 w-2.5" />
                    Verified
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{roleLabel}</span>
              {role === 'owner' && usage && (
                <span className="text-xs text-muted-foreground">
                  {usage.planName} plan
                </span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          {role === 'owner' && (
            <>
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={event => {
                  event.preventDefault()
                  setManageFocusOpen(true)
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span>Business type</span>
                  {focusSummary && (
                    <span className="truncate text-xs text-muted-foreground">
                      {focusSummary}
                    </span>
                  )}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/subscription" className="cursor-pointer">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  {nearOrAtLimit ? 'Upgrade plan' : 'Subscription'}
                  {nearOrAtLimit && (
                    <Badge
                      variant="outline"
                      className="ml-auto border-amber-300 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                    >
                      Limit
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {role === 'owner' && (
        <OwnerFocusDialog
          mode="manage"
          open={manageFocusOpen}
          onOpenChange={setManageFocusOpen}
        />
      )}
    </>
  )
}
