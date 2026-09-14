'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, MessageCircle, Plus } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import type { Chat } from '@/types/chat'
import { ChatAvatar } from '@/components/chat/ChatAvatar'

interface ChatListProps {
  chats: Chat[]
  currentUserId: string
  selectedChatId?: string
  onChatSelect: (chat: Chat) => void
  onNewChat?: () => void
}

export function ChatList({
  chats,
  currentUserId,
  selectedChatId,
  onChatSelect,
  onNewChat,
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true
    const otherParticipant =
      chat.participant1Id === currentUserId
        ? chat.participant2Name
        : chat.participant1Name
    const propertyName = chat.propertyName || ''
    const searchLower = searchQuery.toLowerCase()
    return (
      otherParticipant.toLowerCase().includes(searchLower) ||
      propertyName.toLowerCase().includes(searchLower) ||
      chat.lastMessage?.toLowerCase().includes(searchLower)
    )
  })

  const getOtherParticipant = (chat: Chat) => {
    if (chat.participant1Id === currentUserId) {
      return {
        name: chat.participant2Name,
        avatar: chat.participant2Avatar,
      }
    }
    return {
      name: chat.participant1Name,
      avatar: chat.participant1Avatar,
    }
  }

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return ''
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true })
      } else if (diffInHours < 48) {
        return 'Yesterday'
      } else {
        return format(date, 'MMM dd')
      }
    } catch {
      return ''
    }
  }

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b p-3 sm:p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </h2>
          {onNewChat && (
            <Button size="icon" variant="outline" onClick={onNewChat}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-muted-foreground text-center">
              {searchQuery ? 'No chats found' : 'No messages yet'}
            </p>
            {!searchQuery && onNewChat && (
              <Button variant="outline" className="mt-4" onClick={onNewChat}>
                Start New Chat
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredChats.map(chat => {
              const otherParticipant = getOtherParticipant(chat)
              const isSelected = chat.id === selectedChatId

              return (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat)}
                  className={`w-full p-3 text-left transition-colors hover:bg-muted/50 sm:p-4 ${
                    isSelected ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <ChatAvatar
                        name={otherParticipant.name}
                        avatar={otherParticipant.avatar}
                        className="h-12 w-12"
                      />
                      {chat.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-foreground">
                            {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {otherParticipant.name}
                          </p>
                          {chat.propertyName && (
                            <p className="text-xs text-muted-foreground truncate">
                              {chat.propertyName}
                            </p>
                          )}
                        </div>
                        {chat.lastMessageTime && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatLastMessageTime(chat.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      {chat.lastMessage && (
                        <p
                          className={`text-sm truncate ${
                            chat.unreadCount > 0
                              ? 'font-medium text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {chat.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
