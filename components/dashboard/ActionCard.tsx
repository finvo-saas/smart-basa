'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

export interface QuickAction {
  title: string
  subtitle?: string
  href: string
  icon: React.ReactNode
  /** Soft accent behind the icon (avoid purple gradients). */
  accentClass?: string
}

interface ActionCardProps {
  action: QuickAction
  /** Dense grid tile for mobile primary shortcuts. */
  variant?: 'default' | 'compact'
  className?: string
}

export function ActionCard({
  action,
  variant = 'default',
  className,
}: ActionCardProps) {
  if (variant === 'compact') {
    return (
      <Link
        href={action.href}
        className={cn(
          'flex flex-col items-center gap-2 rounded-2xl border bg-background/80 px-3 py-4 text-center shadow-sm transition active:scale-[0.98] hover:border-primary/40 hover:bg-muted/40',
          className,
        )}
      >
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl text-primary',
            action.accentClass ?? 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200',
          )}
        >
          <span className="[&_svg]:h-5 [&_svg]:w-5">{action.icon}</span>
        </span>
        <span className="text-sm font-semibold leading-tight">{action.title}</span>
      </Link>
    )
  }

  return (
    <Link
      href={action.href}
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-background px-3 py-3 transition active:scale-[0.99] hover:border-primary/40 hover:bg-muted/30',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          action.accentClass ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        )}
      >
        <span className="[&_svg]:h-5 [&_svg]:w-5">{action.icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{action.title}</span>
        {action.subtitle ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {action.subtitle}
          </span>
        ) : null}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
