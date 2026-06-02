'use client'

import { useEffect } from 'react'
import { useStompContext } from '@/lib/stomp-context'
import type { Message } from '@/lib/types'

interface UseChatOptions {
  conversationId: string | null
  onMessage?: (msg: Message) => void
}

export function useChat({ conversationId, onMessage }: UseChatOptions) {
  const { connected, subscribe, publish } = useStompContext()

  useEffect(() => {
    if (!onMessage) return
    return subscribe('/user/queue/messages', (body) => {
      try {
        const msg: Message = JSON.parse(body)
        if (!conversationId || msg.conversationId === conversationId) {
          onMessage(msg)
        }
      } catch {
        // malformed frame — ignore
      }
    })
  }, [conversationId, onMessage, subscribe])

  function sendMessage(_convId: string, serializedBody: string): boolean {
    return publish('/app/chat.send', serializedBody)
  }

  return { connected, sendMessage }
}
