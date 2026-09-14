'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  MessageCircle,
  Building2,
  Check,
  CheckCircle2,
  DollarSign,
  FileText,
  Info,
  UtensilsCrossed,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Notification } from '@/types/complaint'
import { cn } from '@/lib/utils'

interface NotificationCardProps {
  notification: Notification
  onToggleRead: (id: string) => void
}

function visualFor(notification: Notification) {
  const text = `${notification.title} ${notification.message}`.toLowerCase()
  const declined = text.includes('declined') || text.includes('rejected')
  const accepted = text.includes('accepted') || text.includes('confirmed')
  const booking =
    text.includes('request') ||
    text.includes('booking') ||
    text.includes('seat') ||
    notification.link?.includes('bookings')

  if (booking && (text.includes('mess') || text.includes('hostel') || text.includes('seat'))) {
    return {
      icon: declined ? XCircle : accepted ? CheckCircle2 : UtensilsCrossed,
      className: declined
        ? 'bg-destructive/10 text-destructive'
        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
    }
  }
  if (booking) {
    return {
      icon: declined ? XCircle : accepted ? CheckCircle2 : Building2,
      className: declined
        ? 'bg-destructive/10 text-destructive'
        : accepted
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
          : 'bg-primary/10 text-primary',
    }
  }
  if (
    notification.link?.includes('/messages') ||
    text.includes('message from')
  ) {
    return {
      icon: MessageCircle,
      className: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
    }
  }
  if (notification.type === 'bill') {
    return {
      icon: DollarSign,
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
    }
  }
  if (notification.type === 'complaint') {
    return {
      icon: FileText,
      className: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
    }
  }
  if (notification.type === 'other') {
    return {
      icon: Info,
      className: 'bg-muted text-muted-foreground',
    }
  }
  return {
    icon: Bell,
    className: 'bg-primary/10 text-primary',
  }
}

function whenLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return formatDistanceToNow(date, { addSuffix: true })
}

export function NotificationCard({
  notification,
  onToggleRead,
}: NotificationCardProps) {
  const t = useTranslations('tools.notifications')
  const visual = visualFor(notification)
  const Icon = visual.icon
  const time = whenLabel(notification.createdAt)

  const openAndRead = () => {
    if (!notification.read) onToggleRead(notification.id)
  }

  const body = (
    <>
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11',
          visual.className,
        )}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <h3 className="min-w-0 text-sm font-semibold leading-snug sm:text-base">
            {notification.title}
          </h3>
          {time ? (
            <time
              dateTime={notification.createdAt}
              className="shrink-0 text-xs text-muted-foreground"
            >
              {time}
            </time>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {notification.message}
        </p>
        {!notification.read ? (
          <p className="mt-2 text-xs font-medium text-primary">{t('new')}</p>
        ) : null}
      </div>
    </>
  )

  return (
    <article
      className={cn(
        'flex items-start gap-2 rounded-xl border bg-card p-3 shadow-sm sm:gap-3 sm:p-4',
        !notification.read && 'border-primary/30 bg-primary/[0.04]',
      )}
    >
      {notification.link ? (
        <Link
          href={notification.link}
          onClick={openAndRead}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </Link>
      ) : (
        <button
          type="button"
          onClick={openAndRead}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </button>
      )}
      {!notification.read ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label={t('markRead')}
          title={t('markRead')}
          onClick={() => onToggleRead(notification.id)}
        >
          <Check className="h-4 w-4" />
        </Button>
      ) : null}
    </article>
  )
}
