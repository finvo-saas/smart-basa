'use client'

import { useState, useMemo, useEffect, Suspense, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout/Layout'
import { EmptyState, LoadingState } from '@/components/page'
import { ChatList } from '@/components/chat/ChatList'
import { ChatWindow } from '@/components/chat/ChatWindow'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Chat, ChatMessage, ChatUser } from '@/types/chat'
import { Plus, Search } from 'lucide-react'
import { toast } from '@/lib/feedback/toast'
import {
  fetchUserChats,
  fetchChatMessages,
  fetchChatContacts,
  sendChatMessage,
  createChat,
  fetchChatUser,
  fetchChatById,
  type ChatContact,
} from '@/lib/api/messages'
import { getCurrentAccountUserId } from '@/lib/api/account'
import { uploadMediaFile } from '@/lib/api/media'

function MessagesPageContent() {
  const t = useTranslations('tools.messages')
  const tc = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [searchProperty, setSearchProperty] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [userChats, setUserChats] = useState<Chat[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [otherParticipant, setOtherParticipant] = useState<
    ChatUser | undefined
  >(undefined)
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const openingRef = useRef(false)

  const currentUserId = getCurrentAccountUserId()

  const loadChats = useCallback(async () => {
    const result = await fetchUserChats(currentUserId)
    if (result.ok) {
      setUserChats(
        result.data.sort((a, b) => {
          const timeA = a.lastMessageTime
            ? new Date(a.lastMessageTime).getTime()
            : 0
          const timeB = b.lastMessageTime
            ? new Date(b.lastMessageTime).getTime()
            : 0
          return timeB - timeA
        })
      )
    }
  }, [currentUserId])

  const loadContacts = useCallback(async () => {
    const result = await fetchChatContacts()
    if (result.ok) setContacts(result.data)
  }, [])

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    Promise.all([loadChats(), loadContacts()]).finally(() => {
      if (mounted) setIsLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [loadChats, loadContacts])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return
      void loadChats()
    }, 20000)
    return () => window.clearInterval(timer)
  }, [loadChats])

  useEffect(() => {
    const chatId = searchParams.get('chatId')
    const userId = searchParams.get('userId')
    const propertyId = searchParams.get('propertyId')
    const propertyName = searchParams.get('propertyName') || ''
    if (chatId) {
      setSelectedChatId(chatId)
      return
    }
    if ((!userId && !propertyId) || openingRef.current) return
    openingRef.current = true
    void createChat({
      participant2Id: userId || undefined,
      propertyId: propertyId || undefined,
      propertyName,
    }).then(result => {
      openingRef.current = false
      if (!result.ok) {
        toast.error(result.error || t('openFailed'))
        return
      }
      setUserChats(prev => [
        result.data,
        ...prev.filter(chat => chat.id !== result.data.id),
      ])
      setSelectedChatId(result.data.id)
      router.replace(`/messages?chatId=${result.data.id}`)
    })
  }, [searchParams, router, t])

  useEffect(() => {
    if (!selectedChatId) {
      setSelectedChat(null)
      setChatMessages([])
      setOtherParticipant(undefined)
      return
    }

    fetchChatById(selectedChatId).then(result => {
      if (result.ok) setSelectedChat(result.data ?? null)
    })
    fetchChatMessages(selectedChatId).then(result => {
      if (result.ok) setChatMessages(result.data)
    })
    setUserChats(prev =>
      prev.map(chat =>
        chat.id === selectedChatId ? { ...chat, unreadCount: 0 } : chat,
      ),
    )
  }, [selectedChatId])

  useEffect(() => {
    if (!selectedChatId) return
    const timer = window.setInterval(() => {
      if (document.hidden) return
      void fetchChatMessages(selectedChatId).then(result => {
        if (result.ok) setChatMessages(result.data)
      })
    }, 15000)
    return () => window.clearInterval(timer)
  }, [selectedChatId])

  useEffect(() => {
    if (!selectedChat) {
      setOtherParticipant(undefined)
      return
    }
    const otherId =
      selectedChat.participant1Id === currentUserId
        ? selectedChat.participant2Id
        : selectedChat.participant1Id
    fetchChatUser(otherId).then(result => {
      if (result.ok) setOtherParticipant(result.data)
    })
  }, [selectedChat, currentUserId])

  const handleChatSelect = (chat: Chat) => {
    setSelectedChatId(chat.id)
  }

  const handleSendMessage = async (
    content: string,
    type: 'text' | 'image' | 'file' = 'text'
  ) => {
    if (!selectedChat) return

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatId: selectedChat.id,
      senderId: currentUserId,
      receiverId:
        selectedChat.participant1Id === currentUserId
          ? selectedChat.participant2Id
          : selectedChat.participant1Id,
      type,
      content,
      status: 'sending',
      timestamp: new Date().toISOString(),
    }

    setTimeout(() => {
      newMessage.status = 'sent'
    }, 500)

    const result = await sendChatMessage(selectedChat.id, newMessage)
    if (!result.ok) {
      toast.error(result.error || t('sendFailed'))
      return
    }
    setChatMessages(prev => {
      if (prev.some(item => item.id === result.data.id)) return prev
      return [...prev, result.data]
    })
    await loadChats()
  }

  const handleSendFile = async (file: File) => {
    if (!selectedChat) return
    const uploaded = await uploadMediaFile(file, 'chat')
    if (!uploaded.ok) return
    handleSendMessage(uploaded.data.url, 'file')
  }

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const handleNewChat = async () => {
    const contact = contacts.find(item => item.userId === selectedContactId)
    if (!contact) return
    const result = await createChat({
      participant2Id: contact.userId,
      propertyId: contact.propertyId,
      propertyName: contact.propertyName,
    })
    if (!result.ok) {
      toast.error(result.error || t('openFailed'))
      return
    }
    setUserChats(prev => [
      result.data,
      ...prev.filter(chat => chat.id !== result.data.id),
    ])
    setSelectedChatId(result.data.id)
    setShowNewChatDialog(false)
    router.replace(`/messages?chatId=${result.data.id}`)
  }

  const filteredContacts = useMemo(() => {
    const query = searchProperty.trim().toLowerCase()
    if (!query) return contacts
    return contacts.filter(
      person =>
        person.name.toLowerCase().includes(query) ||
        person.label.toLowerCase().includes(query),
    )
  }, [searchProperty, contacts])

  return (
    <Layout>
      <div className="mx-auto -mb-16 flex h-[calc(100dvh-3.5rem-4.75rem)] min-h-0 w-full max-w-7xl flex-col px-2 py-2 sm:px-4 md:mb-0 md:h-[calc(100dvh-6.25rem)] md:px-6 md:py-4 lg:px-8">

        {isLoading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <LoadingState label={t('loading')} variant="skeleton" />
          </div>
        ) : userChats.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
          <EmptyState title={t('emptyTitle')} description={t('emptyDesc')}>
            <Button onClick={() => setShowNewChatDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('startNewChat')}
            </Button>
          </EmptyState>
          </div>
        ) : null}

        {!isLoading && userChats.length > 0 && (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
            <div className={selectedChatId ? 'hidden min-h-0 lg:block' : 'min-h-0'}>
              <ChatList
                chats={userChats}
                currentUserId={currentUserId}
                selectedChatId={selectedChatId || undefined}
                onChatSelect={handleChatSelect}
                onNewChat={() => setShowNewChatDialog(true)}
              />
            </div>

            <div
              className={
                selectedChatId ? 'min-h-0' : 'hidden min-h-0 lg:block'
              }
            >
              <ChatWindow
                chat={selectedChat}
                currentUserId={currentUserId}
                messages={chatMessages}
                otherParticipant={otherParticipant}
                onSendMessage={handleSendMessage}
                onSendFile={handleSendFile}
                onCall={handleCall}
                onBack={
                  selectedChatId
                    ? () => {
                        setSelectedChatId(null)
                        router.replace('/messages')
                      }
                    : undefined
                }
              />
            </div>
          </div>
        )}

        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('startNewChat')}</DialogTitle>
              <DialogDescription>{t('startNewChatDesc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">{t('searchProperty')}</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('searchPropertyPlaceholder')}
                    value={searchProperty}
                    onChange={e => setSearchProperty(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Label>{t('choosePerson')}</Label>
                {filteredContacts.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('noContactsDesc')}
                  </p>
                ) : (
                  <Select
                    value={selectedContactId}
                    onValueChange={setSelectedContactId}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={t('choosePerson')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredContacts.map(person => (
                        <SelectItem key={person.userId} value={person.userId}>
                          <div className="flex flex-col">
                            <span className="font-medium">{person.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {person.label}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNewChatDialog(false)}
                >
                  {tc('cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleNewChat}
                  disabled={!selectedContactId}
                >
                  {t('startChat')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
}

export default function MessagesPage() {
  const t = useTranslations('tools.messages')
  const tc = useTranslations('common')

  return (
    <Suspense
      fallback={
        <Layout>
          <div className="flex min-h-[40vh] items-center justify-center p-8 text-muted-foreground">
            {t('loading')}
          </div>
        </Layout>
      }
    >
      <MessagesPageContent />
    </Suspense>
  )
}
