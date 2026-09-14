import type { Chat, ChatMessage, ChatUser } from '@/types/chat'
import type { Property } from '@/types/property'
import { fetchProperties } from './properties'
import { apiRequest } from './client'
import type { ApiResult } from './http'
import { hasAuthTokens } from '@/utils/auth-tokens'

export async function fetchUserChats(
  _userId?: string,
): Promise<ApiResult<Chat[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<Chat[]>('/chats/')
}

export async function fetchChatMessages(
  chatId: string,
): Promise<ApiResult<ChatMessage[]>> {
  return apiRequest<ChatMessage[]>(`/chats/${chatId}/messages/`)
}

export async function fetchChatById(
  chatId: string,
): Promise<ApiResult<Chat | undefined>> {
  const result = await apiRequest<Chat>(`/chats/${chatId}/`)
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') return { ok: true, data: undefined }
    return result
  }
  return result
}

export async function fetchChatUser(
  userId: string,
): Promise<ApiResult<ChatUser | undefined>> {
  const result = await apiRequest<ChatUser>(`/chats/users/${userId}/`)
  if (!result.ok) {
    if (result.code === 'NOT_FOUND') return { ok: true, data: undefined }
    return result
  }
  return result
}

export async function fetchUnreadMessageCount(
  _userId?: string,
): Promise<ApiResult<number>> {
  if (!hasAuthTokens()) return { ok: true, data: 0 }
  const result = await apiRequest<{ count: number } | number>(
    '/chats/unread-count/',
  )
  if (!result.ok) return result
  const data = result.data
  return {
    ok: true,
    data: typeof data === 'number' ? data : data.count,
  }
}

export async function sendChatMessage(
  chatId: string,
  message: Omit<ChatMessage, 'id' | 'timestamp' | 'status'> & {
    id?: string
    timestamp?: string
    status?: ChatMessage['status']
  },
): Promise<ApiResult<ChatMessage>> {
  return apiRequest<ChatMessage>(`/chats/${chatId}/messages/`, {
    method: 'POST',
    body: {
      content: message.content,
      type: message.type || 'text',
      receiverId: message.receiverId,
      fileName: message.fileName || '',
      fileSize: message.fileSize,
      thumbnail: message.thumbnail || '',
    },
  })
}

export type ChatContact = {
  userId: string
  name: string
  avatar?: string
  context: string
  contextId?: string
  label: string
  propertyId?: string
  propertyName?: string
}

export async function fetchChatContacts(): Promise<ApiResult<ChatContact[]>> {
  if (!hasAuthTokens()) return { ok: true, data: [] }
  return apiRequest<ChatContact[]>('/chats/contacts/')
}

export async function createChat(
  chat: {
    participant2Id?: string
    propertyId?: string
    propertyName?: string
    initialMessage?: string
  },
): Promise<ApiResult<Chat>> {
  return apiRequest<Chat>('/chats/', {
    method: 'POST',
    body: {
      participant2Id: chat.participant2Id || undefined,
      propertyId: chat.propertyId || undefined,
      propertyName: chat.propertyName || '',
      initialMessage: chat.initialMessage || '',
    },
  })
}

export async function fetchMessageProperties(): Promise<ApiResult<Property[]>> {
  return fetchProperties()
}
