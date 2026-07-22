import { apiFetch, ApiError } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import type { ApiResponse, Conversation, Message } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL

/** Envoi d'un message vocal (multipart). Le navigateur pose la frontière multipart lui-même. */
export async function sendAudioMessage(
  convId: string,
  blob: Blob,
  durationSec: number,
  clientMsgId: string,
): Promise<Message> {
  const session = getSession()
  const form = new FormData()
  form.append('file', blob, 'voice.webm')
  form.append('durationSec', String(durationSec))
  form.append('clientMsgId', clientMsgId)

  const res = await fetch(`${BASE}/api/v1/messaging/conversations/${convId}/audio`, {
    method: 'POST',
    headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
    body: form,
  })
  const body: ApiResponse<Message> = await res.json()
  if (!res.ok || !body.success) {
    throw new ApiError(body.message ?? `HTTP ${res.status}`, res.status)
  }
  return body.data as Message
}

/** Envoi d'une pièce jointe (PDF/JPEG/PNG). Multipart, frontière posée par le navigateur. */
export async function sendAttachment(
  convId: string,
  file: File,
  clientMsgId: string,
): Promise<Message> {
  const session = getSession()
  const form = new FormData()
  form.append('file', file, file.name)
  form.append('clientMsgId', clientMsgId)

  const res = await fetch(`${BASE}/api/v1/messaging/conversations/${convId}/attachment`, {
    method: 'POST',
    headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
    body: form,
  })
  const body: ApiResponse<Message> = await res.json()
  if (!res.ok || !body.success) {
    throw new ApiError(body.message ?? `HTTP ${res.status}`, res.status)
  }
  return body.data as Message
}

/** Le médecin active/désactive le droit de réponse du patient. */
export async function setPatientReply(convId: string, allowed: boolean): Promise<void> {
  await apiFetch<unknown>(
    `/api/v1/messaging/conversations/${convId}/patient-reply?allowed=${allowed}`,
    { method: 'PUT' },
  )
}

/**
 * Récupère un média protégé (audio ou document) et renvoie un blob URL. La navigation directe
 * n'enverrait pas le token (stocké hors cookie) → on fetch avec l'en-tête Authorization.
 */
export async function fetchAudioObjectUrl(mediaUrl: string): Promise<string> {
  const session = getSession()
  const res = await fetch(`${BASE}${mediaUrl}`, {
    headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
  })
  if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

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
