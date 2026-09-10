'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  UtensilsCrossed,
  Calendar,
  MessageSquare,
  ScrollText,
  Wallet,
  LayoutDashboard,
  Calculator,
  Users,
} from 'lucide-react'
import type { Mess } from '@/types/mess'
import { cn } from '@/lib/utils'

interface MessManageLinksProps {
  mess: Mess
  /** compact = icon buttons in a card; full = labeled row */
  variant?: 'compact' | 'full'
  className?: string
}

const links = (messId: string) =>
  [
    {
      href: `/mess/${messId}/members`,
      label: 'Renters',
      icon: Users,
    },
    {
      href: `/mess/${messId}/hisab`,
      label: 'মিল হিসাব',
      icon: Calculator,
    },
    {
      href: `/mess/${messId}/meals`,
      label: 'Meals',
      icon: UtensilsCrossed,
    },
    {
      href: `/mess/${messId}/attendance`,
      label: 'Attendance',
      icon: Calendar,
    },
    {
      href: `/mess/${messId}/sms`,
      label: 'SMS',
      icon: MessageSquare,
    },
    {
      href: `/mess/${messId}/rules`,
      label: 'Rules',
      icon: ScrollText,
    },
    {
      href: `/mess/${messId}/expenses`,
      label: 'Expenses',
      icon: Wallet,
    },
  ] as const

/** Reusable owner links for a single mess facility. */
export function MessManageLinks({
  mess,
  variant = 'full',
  className,
}: MessManageLinksProps) {
  const items = links(mess.id)

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-2 min-[360px]:grid-cols-2',
          className
        )}
      >
        {items.map(item => (
          <Button
            key={item.href}
            variant="outline"
            size="sm"
            asChild
            className="h-auto min-w-0 justify-start whitespace-normal px-2.5 py-2 text-left text-xs"
          >
            <Link href={item.href} className="min-w-0">
              <item.icon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {items.map(item => (
        <Button key={item.href} variant="outline" size="sm" asChild>
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Link>
        </Button>
      ))}
      <Button variant="secondary" size="sm" asChild>
        <Link href="/mess/student-dashboard">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Student view
        </Link>
      </Button>
    </div>
  )
}
