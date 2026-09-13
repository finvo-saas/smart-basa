'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import { EmptyState } from '@/components/page'
import { NotificationCard } from '@/components/notification/NotificationCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck } from 'lucide-react'
import type { Notification } from '@/types/complaint'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/api/complaints'

export default function NotificationsPage() {
  const t = useTranslations('tools.notifications')
  const tc = useTranslations('common')
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    fetchNotifications().then(result => {
      if (result.ok) setNotifications(result.data)
    })
  }, [])

  const userNotifications = notifications

  const sortedNotifications = useMemo(() => {
    return [...userNotifications].sort((a, b) => {
      if (a.read !== b.read) {
        return a.read ? 1 : -1
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [userNotifications])

  const unreadCount = useMemo(() => {
    return userNotifications.filter(n => !n.read).length
  }, [userNotifications])

  const handleToggleRead = async (id: string) => {
    const result = await markNotificationRead(id)
    if (!result.ok) return
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n)),
    )
  }

  const handleMarkAllRead = async () => {
    const result = await markAllNotificationsRead()
    if (!result.ok) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{t('title')}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {unreadCount > 0
                  ? t('unreadCount', { count: unreadCount })
                  : t('allCaughtUp')}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              {tc('markAllRead')}
            </Button>
          )}
        </div>

        {sortedNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t('emptyTitle')}
            description={t('emptyDesc')}
          />
        ) : (
          <div className="space-y-3 sm:space-y-2">
            {sortedNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onToggleRead={handleToggleRead}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
