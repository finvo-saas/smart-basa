import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-balance text-xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions ? (
        <div className="flex min-w-0 flex-wrap gap-2 [&_a]:max-w-full [&_button]:max-w-full">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
