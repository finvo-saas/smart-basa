'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import {
  Check,
  CheckCheck,
  Clock,
  Download,
  Image as ImageIcon,
} from 'lucide-react'
import Image from 'next/image'
import type { ChatMessage } from '@/types/chat'
import { ChatAvatar } from '@/components/chat/ChatAvatar'
import { SafeText } from '@/components/security/SafeText'
import { sanitizeUrl } from '@/lib/security/sanitize'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  showAvatar?: boolean
  showTime?: boolean
  senderName?: string
  senderAvatar?: string
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = false,
  showTime = true,
  senderName,
  senderAvatar,
}: MessageBubbleProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground" />
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />
      default:
        return null
    }
  }

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm')
    } catch {
      return ''
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div
      className={`flex gap-2 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="shrink-0">
          <ChatAvatar
            name={senderName || ''}
            avatar={senderAvatar}
            className="h-8 w-8"
          />
        </div>
      )}

      {/* Message Content */}
      <div
        className={`flex min-w-0 max-w-[min(85%,20rem)] flex-col sm:max-w-[70%] ${
          isOwn ? 'items-end' : 'items-start'
        }`}
      >
        {/* Sender Name (for group chats) */}
        {!isOwn && senderName && showAvatar && (
          <span className="text-xs font-medium text-muted-foreground mb-1 px-2">
            {senderName}
          </span>
        )}

        {/* Message Bubble */}
        <div
          className={`max-w-full break-words rounded-2xl px-3 py-2 [overflow-wrap:anywhere] sm:px-4 ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          }`}
        >
          {/* Text Message */}
          {message.type === 'text' && (
            <SafeText as="p" className="text-sm">
              {message.content}
            </SafeText>
          )}

          {/* Image Message */}
          {message.type === 'image' && (
            <div className="space-y-2">
              <div className="relative max-w-full overflow-hidden rounded-lg sm:max-w-sm">
                <Image
                  src={message.content}
                  alt="Shared image"
                  width={300}
                  height={300}
                  className="object-cover w-full h-auto"
                  sizes="(max-width: 640px) 300px, 400px"
                />
              </div>
              {message.content !== message.thumbnail && (
                <p className="text-xs opacity-80">Tap to view full image</p>
              )}
            </div>
          )}

          {/* File Message */}
          {message.type === 'file' && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background/20 rounded-lg">
                <Download className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {message.fileName || 'File'}
                </p>
                {message.fileSize && (
                  <p className="text-xs opacity-80">
                    {formatFileSize(message.fileSize)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  const safe = sanitizeUrl(message.content)
                  if (safe) window.open(safe, '_blank', 'noopener,noreferrer')
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* System Message */}
          {message.type === 'system' && (
            <SafeText as="p" className="text-xs italic opacity-80">
              {message.content}
            </SafeText>
          )}
        </div>

        {/* Time and Status */}
        {showTime && (
          <div
            className={`flex items-center gap-1 mt-1 px-2 ${
              isOwn ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
            {isOwn && getStatusIcon()}
          </div>
        )}
      </div>
    </div>
  )
}
