'use client'

import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function DiscoverSection({
  eyebrow,
  title,
  description,
  href,
  hrefLabel,
  onRefresh,
  refreshing,
  children,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  href?: string
  hrefLabel?: string
  onRefresh?: () => void
  refreshing?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('py-10 sm:py-14', className)}>
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0 max-w-2xl space-y-1">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="text-balance text-xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h2>
            {description ? (
              <p className="text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex w-full flex-wrap items-stretch gap-2 sm:w-auto sm:shrink-0 sm:items-center">
            {onRefresh ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-w-0 flex-1 sm:flex-none"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={cn('mr-1.5 h-4 w-4 shrink-0', refreshing && 'animate-spin')}
                />
                <span className="truncate">Refresh</span>
              </Button>
            ) : null}
            {href && hrefLabel ? (
              <Button asChild size="sm" className="min-w-0 flex-1 sm:flex-none">
                <Link href={href} className="truncate">
                  {hrefLabel}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
        {children}
      </div>
    </section>
  )
}

export function DiscoverGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {children}
    </div>
  )
}
