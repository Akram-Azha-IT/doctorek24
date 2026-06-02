import { apiFetch } from '@/lib/api-client'
import type { Conversation, Message } from '@/lib/types'

export async function getConversations(): Promise<Conversation[]> {
  return apiFetch<Conversation[]>('/api/v1/messaging/conversations')
}

export async function startConversation(otherUserId: string): Promise<Conversation> {
  return apiFetch<Conversation>('/api/v1/messaging/conversations', {
    method: 'POST',
    body: JSON.stringify({ otherUserId }),
  })
}

export async function getMessages(
  convId: string,
  page = 0,
  size = 50,
): Promise<Message[]> {
  return apiFetch<Message[]>(
    `/api/v1/messaging/conversations/${convId}/messages?page=${page}&size=${size}`,
  )
}

export async function sendMessageRest(convId: string, content: string, clientMsgId: string): Promise<Message> {
  return apiFetch<Message>(`/api/v1/messaging/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ conversationId: convId, content, clientMsgId }),
  })
}

export async function markRead(convId: string): Promise<void> {
  await apiFetch<null>(`/api/v1/messaging/conversations/${convId}/read`, {
    method: 'PUT',
  })
}
