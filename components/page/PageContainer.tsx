import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/**
 * Standard horizontal padding and max width for app pages (matches bills, search).
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  )
}
