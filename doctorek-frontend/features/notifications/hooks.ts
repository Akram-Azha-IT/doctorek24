'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStompContext } from '@/lib/stomp-context'
import type { AppNotification } from '@/lib/types'
import { getNotifications, markAllRead, markRead } from './api'

export function useNotifications() {
  const qc = useQueryClient()
  const { subscribe } = useStompContext()

  // Real-time: invalidate on new notification
  useEffect(() => {
    return subscribe('/user/queue/notifications', () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    })
  }, [subscribe, qc])

  return useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

export function useUnreadNotifCount() {
  const { data = [] } = useNotifications()
  return data.filter((n: AppNotification) => !n.read).length
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
