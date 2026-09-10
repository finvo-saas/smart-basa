import { cn } from '@/lib/utils'
import { ListPageSkeleton } from './ListPageSkeleton'

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-10 w-10 shrink-0 animate-spin rounded-full border-[3px] border-primary border-t-transparent',
        className
      )}
      aria-hidden
    />
  )
}

export function LoadingState({
  label = 'Loading...',
  /** @deprecated Use `label` */
  message,
  className,
  variant = 'spinner',
  skeletonCount = 6,
  skeletonVariant = 'card',
}: {
  label?: string
  message?: string
  className?: string
  variant?: 'spinner' | 'skeleton'
  skeletonCount?: number
  skeletonVariant?: 'card' | 'row' | 'table'
}) {
  const text = message ?? label

  if (variant === 'skeleton') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={text}
        className={className}
      >
        <p className="sr-only">{text}</p>
        <ListPageSkeleton count={skeletonCount} variant={skeletonVariant} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex w-full min-h-[200px] items-center justify-center py-10',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div className="flex w-[7.75rem] flex-col items-center gap-4 rounded-[1.75rem] border border-border bg-background px-5 py-8 shadow-sm dark:bg-card">
        <LoadingSpinner />
        <p className="text-center text-sm leading-none text-muted-foreground">
          {text}
        </p>
      </div>
    </div>
  )
}
