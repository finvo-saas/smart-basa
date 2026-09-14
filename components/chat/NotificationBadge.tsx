'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { fetchUnreadMessageCount } from '@/lib/api/messages'

interface NotificationBadgeProps {
  userId: string
  className?: string
}

const listeners = new Set<(count: number) => void>()
let sharedCount = 0
let timer: number | null = null

function publish(count: number) {
  sharedCount = count
  listeners.forEach(listener => listener(count))
}

function ensurePolling() {
  if (timer != null) return
  const tick = () => {
    if (document.hidden || listeners.size === 0) return
    void fetchUnreadMessageCount().then(result => {
      if (result.ok) publish(result.data)
    })
  }
  tick()
  timer = window.setInterval(tick, 30000)
}

function stopPolling() {
  if (listeners.size > 0 || timer == null) return
  window.clearInterval(timer)
  timer = null
}

export function NotificationBadge({
  userId,
  className,
}: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(sharedCount)

  useEffect(() => {
    if (!userId) return
    listeners.add(setUnreadCount)
    setUnreadCount(sharedCount)
    ensurePolling()
    return () => {
      listeners.delete(setUnreadCount)
      stopPolling()
    }
  }, [userId])

  if (unreadCount === 0) return null

  return (
    <Badge
      variant="destructive"
      className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs ${className}`}
    >
      {unreadCount > 9 ? '9+' : unreadCount}
    </Badge>
  )
}
