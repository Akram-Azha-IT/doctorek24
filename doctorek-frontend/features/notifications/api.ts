import { apiFetch } from '@/lib/api-client'
import type { AppNotification } from '@/lib/types'

export const getNotifications = () =>
  apiFetch<AppNotification[]>('/api/v1/notifications')

export const markRead = (id: string) =>
  apiFetch<void>(`/api/v1/notifications/${id}/read`, { method: 'PUT' })

export const markAllRead = () =>
  apiFetch<void>('/api/v1/notifications/read-all', { method: 'PUT' })
