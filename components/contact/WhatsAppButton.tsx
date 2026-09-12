'use client'

import { useTranslations } from 'next-intl'
import { Button, type ButtonProps } from '@/components/ui/button'
import { whatsappLink } from '@/lib/contact/whatsapp'
import { cn } from '@/lib/utils'

/** Brand glyph — lucide has no WhatsApp icon. */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn('h-4 w-4', className)}
    >
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.79.97-.97 1.17-.18.2-.35.22-.65.07-.3-.15-1.13-.42-2.15-1.33-.8-.71-1.34-1.59-1.49-1.89-.15-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.45 0 1.45 1.05 2.84 1.2 3.04.15.2 2.06 3.29 5.02 4.49.7.3 1.25.48 1.68.62.7.22 1.34.19 1.84.12.56-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z" />
      <path d="M12.04 2C6.6 2 2.17 6.43 2.17 11.87c0 1.74.45 3.44 1.32 4.94L2 22l5.34-1.4a9.83 9.83 0 0 0 4.7 1.2h.01c5.43 0 9.86-4.43 9.86-9.87A9.8 9.8 0 0 0 19 4.9 9.8 9.8 0 0 0 12.04 2Zm0 18.05h-.01a8.2 8.2 0 0 1-4.16-1.14l-.3-.18-3.09.81.83-3.02-.19-.31a8.15 8.15 0 0 1-1.25-4.34c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.86 5.79 2.4a8.13 8.13 0 0 1 2.4 5.8c0 4.52-3.68 8.19-8.2 8.19Z" />
    </svg>
  )
}

type WhatsAppButtonProps = Omit<ButtonProps, 'asChild' | 'children'> & {
  /** Number as stored by the API; local Bangladesh formats are accepted too. */
  number?: string | null
  /** Pre-filled first message. */
  message?: string
  label?: string
  showNumber?: boolean
}

/**
 * Renders nothing when there is no reachable WhatsApp number, so call sites can
 * drop it in without guarding.
 */
export function WhatsAppButton({
  number,
  message,
  label,
  showNumber = false,
  variant = 'outline',
  className,
  ...props
}: WhatsAppButtonProps) {
  const t = useTranslations('contact')
  const href = whatsappLink(number, message)
  if (!href) return null

  return (
    <Button variant={variant} className={className} asChild {...props}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon className="shrink-0 text-[#25D366]" />
        <span className="truncate">{label ?? t('whatsapp')}</span>
        {showNumber && number ? (
          <span className="text-muted-foreground">{number}</span>
        ) : null}
      </a>
    </Button>
  )
}
