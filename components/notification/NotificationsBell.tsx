'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchNotifications } from '@/lib/api/complaints'

export function NotificationsBell() {
  const t = useTranslations('layout')
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true
    const load = () => {
      fetchNotifications().then(result => {
        if (!active || !result.ok) return
        setUnread(result.data.filter(item => !item.read).length)
      })
    }
    load()
    const interval = window.setInterval(load, 20000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className="relative h-9 w-9 shrink-0 md:h-10 md:w-10"
      title={t('notifications')}
    >
      <Link href="/notifications" aria-label={t('notifications')}>
        <Bell className="h-4 w-4 md:h-5 md:w-5" />
        {unread > 0 ? (
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
          >
            {unread > 9 ? '9+' : unread}
          </Badge>
        ) : null}
      </Link>
    </Button>
  )
}
