import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getConversations,
  getMessages,
  markRead,
  sendMessageRest,
  startConversation,
} from './api'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    staleTime: 30_000,
  })
}

export function useMessages(convId: string | null) {
  return useQuery({
    queryKey: ['messages', convId],
    queryFn: () => getMessages(convId!),
    enabled: !!convId,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  })
}

export function useStartConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: startConversation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}

export function useSendMessage(convId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => sendMessageRest(convId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', convId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useMarkRead(convId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markRead(convId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}
