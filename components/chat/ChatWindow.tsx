'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MessageBubble } from '@/components/chat/MessageBubble'
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  X,
  Phone,
  MapPin,
  ArrowLeft,
} from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'
import type { Chat, ChatMessage, ChatUser } from '@/types/chat'
import { ChatAvatar } from '@/components/chat/ChatAvatar'
import { getAcceptAttribute, validateFile } from '@/lib/security/file-upload'
import { toast } from '@/lib/feedback/toast'

interface ChatWindowProps {
  chat: Chat | null
  currentUserId: string
  messages: ChatMessage[]
  otherParticipant?: ChatUser
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file') => void
  onSendFile?: (file: File) => void
  onCall?: (phone: string) => void
  onBack?: () => void
}

export function ChatWindow({
  chat,
  currentUserId,
  messages,
  otherParticipant,
  onSendMessage,
  onSendFile,
  onCall,
  onBack,
}: ChatWindowProps) {
  const [messageText, setMessageText] = useState('')
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!chat) {
    return (
      <Card className="flex h-full min-h-0 items-center justify-center">
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Select a chat to start messaging
          </p>
        </CardContent>
      </Card>
    )
  }

  const otherUser =
    chat.participant1Id === currentUserId
      ? {
          id: chat.participant2Id,
          name: chat.participant2Name,
          avatar: chat.participant2Avatar,
        }
      : {
          id: chat.participant1Id,
          name: chat.participant1Name,
          avatar: chat.participant1Avatar,
        }

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim())
      setMessageText('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type.startsWith('image/')) {
      const result = validateFile(file, 'chatImage')
      if (!result.valid) {
        toast.error('Invalid image', 'Choose a JPEG, PNG, WebP, or GIF under 3 MB.')
        e.target.value = ''
        return
      }
      const reader = new FileReader()
      reader.onload = event => {
        setImagePreview(event.target?.result as string)
        setShowImagePreview(true)
        setSelectedFile(result.file)
      }
      reader.readAsDataURL(result.file)
    } else {
      const result = validateFile(file, 'chatAttachment')
      if (!result.valid) {
        toast.error('Invalid file', 'Choose a PDF, DOC, DOCX, or TXT under 10 MB.')
        e.target.value = ''
        return
      }
      setSelectedFile(result.file)
      onSendFile?.(result.file)
    }
  }

  const handleSendImage = () => {
    if (selectedFile && imagePreview) {
      // In real app, upload image first then send URL
      onSendMessage(imagePreview, 'image')
      setShowImagePreview(false)
      setImagePreview(null)
      setSelectedFile(null)
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  const handleImageCancel = () => {
    setShowImagePreview(false)
    setImagePreview(null)
    setSelectedFile(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups, message) => {
      const date = format(new Date(message.timestamp), 'yyyy-MM-dd')
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
      return groups
    },
    {} as Record<string, ChatMessage[]>
  )

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today'
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday'
    } else {
      return format(date, 'MMMM dd, yyyy')
    }
  }

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="shrink-0 border-b px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {onBack ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 lg:hidden"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            ) : null}
            <ChatAvatar
              name={otherUser.name}
              avatar={otherUser.avatar}
              className="h-10 w-10"
            />
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{otherUser.name}</CardTitle>
              {chat.propertyName && (
                <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{chat.propertyName}</span>
                </div>
              )}
              {otherParticipant?.isOnline && (
                <p className="text-xs text-green-600">Online</p>
              )}
            </div>
          </div>
          {onCall && otherParticipant?.phone ? (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => onCall(otherParticipant.phone)}
            >
              <Phone className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </CardHeader>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4">
        <div className="space-y-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-muted px-3 py-1 rounded-full">
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatDateHeader(date)}
                  </span>
                </div>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message, index) => {
                const isOwn = message.senderId === currentUserId
                const prevMessage = index > 0 ? dateMessages[index - 1] : null
                const showAvatar =
                  !isOwn &&
                  (!prevMessage ||
                    prevMessage.senderId !== message.senderId ||
                    new Date(message.timestamp).getTime() -
                      new Date(prevMessage.timestamp).getTime() >
                      300000) // 5 minutes

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    senderName={isOwn ? undefined : otherUser.name}
                    senderAvatar={isOwn ? undefined : otherUser.avatar}
                  />
                )
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview Image</DialogTitle>
            <DialogDescription>Review before sending</DialogDescription>
          </DialogHeader>
          {imagePreview && (
            <div className="space-y-4">
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-contain"
                  sizes="400px"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleImageCancel}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSendImage}>
                  Send Image
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Input Area */}
      <div className="shrink-0 border-t p-2 sm:p-3">
        {/* Image Preview */}
        {selectedFile && imagePreview && !showImagePreview && (
          <div className="mb-2 relative inline-block">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={handleImageCancel}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="flex min-w-0 items-end gap-1.5 sm:gap-2">
          {/* File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept={getAcceptAttribute('chatAttachment')}
          />
          <input
            ref={imageInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept={getAcceptAttribute('chatImage')}
          />

          {/* Attach Button */}
          <div className="flex shrink-0 gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10"
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          {/* Message Input */}
          <Textarea
            value={messageText}
            onChange={e => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="max-h-28 min-h-10 min-w-0 flex-1 resize-none py-2"
            rows={1}
          />

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!messageText.trim()}
            size="icon"
            className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
