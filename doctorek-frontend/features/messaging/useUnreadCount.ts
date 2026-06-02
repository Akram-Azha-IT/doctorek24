'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStompContext } from '@/lib/stomp-context'
import { useConversations } from './hooks'

export function useUnreadCount() {
  const qc = useQueryClient()
  const { subscribe } = useStompContext()

  useEffect(() => {
    return subscribe('/user/queue/messages', () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
    })
  }, [subscribe, qc])

  const { data: conversations = [] } = useConversations()
  return conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)
}
