import Image from 'next/image'
import { cn } from '@/lib/utils'

const BRAND_ALT = 'SmartBasa'

/** Square app mark — header, drawers, and compact spots. */
export function BrandIcon({
  className,
  priority = false,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-border',
        'h-8 w-8',
        className
      )}
    >
      <Image
        src="/brand/smartbasa-icon.png"
        alt={BRAND_ALT}
        width={96}
        height={96}
        priority={priority}
        className="h-full w-full object-contain p-0.5"
      />
    </span>
  )
}

/** "SmartBasa" wordmark. Ships a light-on-dark variant for dark theme. */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <>
      <Image
        src="/brand/smartbasa-wordmark.png"
        alt={BRAND_ALT}
        width={360}
        height={48}
        priority
        className={cn(
          'w-auto max-w-full min-w-0 object-contain dark:hidden',
          'h-4',
          className
        )}
      />
      <Image
        src="/brand/smartbasa-wordmark-dark.png"
        alt={BRAND_ALT}
        width={360}
        height={48}
        priority
        className={cn(
          'hidden w-auto max-w-full min-w-0 object-contain dark:block',
          'h-4',
          className
        )}
      />
    </>
  )
}

/** Full lockup (mark + wordmark) for the footer and marketing surfaces. */
export function BrandLockup({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/smartbasa-logo.png"
      alt={BRAND_ALT}
      width={256}
      height={256}
      className={cn('h-16 w-auto object-contain', className)}
    />
  )
}
