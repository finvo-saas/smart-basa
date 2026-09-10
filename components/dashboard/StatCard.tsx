'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  /** Optional secondary line, e.g. "72% occupied" */
  hint?: string
  /** When set, the whole card becomes a link to this page */
  href?: string
  className?: string
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  href,
  className,
}: StatCardProps) {
  const card = (
    <Card
      className={cn(
        'h-full overflow-hidden transition-all md:shadow-sm',
        href ? 'hover:border-primary/50 hover:shadow-md' : 'hover:shadow-md',
        className
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-3 pb-2 sm:p-6 sm:pb-2">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-medium leading-snug text-muted-foreground sm:text-xs md:text-sm">
            {label}
          </p>
          <p className="mt-1 break-words text-xl font-bold leading-tight tabular-nums sm:text-2xl md:text-3xl">
            {value}
          </p>
          {hint && (
            <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs md:text-sm">
              {hint}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div className="rounded-lg bg-muted p-1.5 sm:rounded-xl sm:p-2 md:p-3">
            <div className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6">{icon}</div>
          </div>
          {href && (
            <ChevronRight
              className="hidden h-4 w-4 text-muted-foreground min-[360px]:block"
              aria-hidden="true"
            />
          )}
        </div>
      </CardHeader>
      <div className="h-1 bg-gradient-to-r from-primary/70 via-primary/60 to-primary/60" />
    </Card>
  )

  if (!href) return card

  return (
    <Link href={href} className="block h-full">
      {card}
    </Link>
  )
}
