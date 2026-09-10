'use client'

import Link from 'next/link'
import { Check, LogOut, User } from 'lucide-react'
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
import { logout } from '@/utils/auth'
import { useOwnerFocus } from '@/hooks/useOwnerFocus'
import { ownerRoleLabel } from '@/lib/owner-focus'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'

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

  const handleLogout = async () => {
    await logout()
    window.location.assign('/')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-full outline-none ring-offset-background transition-colors',
            'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
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
      <DropdownMenuContent align="end" className="w-56">
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
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
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
  )
}
