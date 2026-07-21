'use client'

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Conversation, Message } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useMessages, useMarkRead } from '../hooks'
import { useChat } from '../useChat'
import { useAudioRecorder, MAX_AUDIO_SEC } from '../useAudioRecorder'
import { MessageBubble } from './MessageBubble'
import { sendMessageRest, sendAudioMessage } from '../api'

interface ChatWindowProps {
  conversation: Conversation
}

function getOtherName(conv: Conversation, myId: string) {
  return myId === conv.patientId ? conv.medecinName : conv.patientName
}

export function ChatWindow({ conversation }: ChatWindowProps) {
  const session = getSession()
  const myId = session?.id ?? ''
  const qc = useQueryClient()

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const recorder = useAudioRecorder()

  const { data: serverMessages = [] } = useMessages(conversation.id)
  const markReadMutation = useMarkRead(conversation.id)

  // Merge server messages + optimistic; drop optimistic once server has matching content+sender
  const allMessages = (() => {
    const serverIds = new Set(serverMessages.map((m) => m.id))
    const extras = optimisticMessages.filter(
      (m) =>
        !serverIds.has(m.id) &&
        !serverMessages.some((s) => s.senderId === m.senderId && s.content === m.content),
    )
    return [...serverMessages].reverse().concat(extras)
  })()

  const { connected, sendMessage } = useChat({
    conversationId: conversation.id,
    onMessage: (msg) => {
      // Remove matching optimistic, then invalidate to refetch real data
      setOptimisticMessages((prev) => prev.filter((m) => m.content !== msg.content))
      qc.invalidateQueries({ queryKey: ['messages', conversation.id] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  // Mark read on open and when messages arrive
  useEffect(() => {
    if (conversation.unreadCount > 0) {
      markReadMutation.mutate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, conversation.unreadCount])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length])

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return
    setInput('')
    setSending(true)

    const clientMsgId = crypto.randomUUID()
    const optimistic: Message = {
      id: `opt-${clientMsgId}`,
      conversationId: conversation.id,
      senderId: myId,
      content,
      sentAt: new Date().toISOString(),
      readAt: null,
    }
    setOptimisticMessages((prev) => [...prev, optimistic])

    try {
      const sent = connected
        ? sendMessage(conversation.id, JSON.stringify({ conversationId: conversation.id, content, clientMsgId }))
        : false

      if (!sent) {
        // STOMP not connected — fall back to REST
        const real = await sendMessageRest(conversation.id, content, clientMsgId)
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
        qc.setQueryData<Message[]>(['messages', conversation.id], (old = []) => [
          ...old,
          real,
        ])
        qc.invalidateQueries({ queryKey: ['conversations'] })
      }
    } catch {
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleMicToggle() {
    if (recorder.state === 'recording') {
      const result = await recorder.stop()
      if (result) await uploadAudio(result.blob, result.durationSec)
    } else {
      recorder.start()
    }
  }

  async function uploadAudio(blob: Blob, durationSec: number) {
    const clientMsgId = crypto.randomUUID()
    const optimistic: Message = {
      id: `opt-${clientMsgId}`,
      conversationId: conversation.id,
      senderId: myId,
      messageType: 'TEXT',
      content: '🎤 Envoi du vocal…',
      sentAt: new Date().toISOString(),
      readAt: null,
    }
    setOptimisticMessages((prev) => [...prev, optimistic])
    setUploadingAudio(true)
    try {
      await sendAudioMessage(conversation.id, blob, durationSec, clientMsgId)
      qc.invalidateQueries({ queryKey: ['messages', conversation.id] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    } catch {
      // échec upload — on retire l'optimiste (le vocal n'est pas parti)
    } finally {
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setUploadingAudio(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-9 h-9 rounded-full bg-[#007DFF] flex items-center justify-center text-white text-sm font-semibold">
          {getOtherName(conversation, myId)
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-[#333333] text-sm leading-tight">
            {getOtherName(conversation, myId)}
          </p>
          <p className="text-[11px] text-gray-400">
            {connected ? (
              <span className="text-green-500">● En ligne</span>
            ) : (
              <span className="text-gray-400">● Hors ligne</span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0">
        {allMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <p className="text-sm">Démarrez la conversation</p>
          </div>
        )}
        {allMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isMine={msg.senderId === myId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        {recorder.state === 'recording' ? (
          /* Barre d'enregistrement vocal */
          <div className="flex items-center gap-3 bg-[#FFF1F0] rounded-2xl px-4 py-2.5">
            <button
              onClick={recorder.cancel}
              className="flex-none flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-100 transition-colors"
              aria-label="Annuler l'enregistrement"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-9 0v14a2 2 0 002 2h6a2 2 0 002-2V6" />
              </svg>
            </button>
            <span className="flex-none h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="flex-1 text-sm font-medium text-red-600 tabular-nums">
              {Math.floor(recorder.elapsed / 60)}:{(recorder.elapsed % 60).toString().padStart(2, '0')}
              <span className="text-red-300"> / {Math.floor(MAX_AUDIO_SEC / 60)}:00</span>
            </span>
            <button
              onClick={handleMicToggle}
              className="flex-none w-8 h-8 rounded-full bg-[#007DFF] flex items-center justify-center hover:bg-[#00263C] transition-colors"
              aria-label="Envoyer le message vocal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-2 bg-[#F0F2F5] rounded-2xl px-4 py-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message…"
              rows={1}
              className="flex-1 bg-transparent resize-none text-sm text-[#333333] placeholder-gray-400 focus:outline-none max-h-32"
            />
            {input.trim() ? (
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-none w-8 h-8 rounded-full bg-[#007DFF] disabled:opacity-40 flex items-center justify-center transition-opacity hover:bg-[#00263C]"
                aria-label="Envoyer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleMicToggle}
                disabled={uploadingAudio}
                className="flex-none w-8 h-8 rounded-full bg-[#007DFF] disabled:opacity-40 flex items-center justify-center hover:bg-[#00263C] transition-colors"
                aria-label="Enregistrer un message vocal"
              >
                {uploadingAudio ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                    <path strokeLinecap="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4" />
                  </svg>
                )}
              </button>
            )}
          </div>
        )}
        <p className="text-[10px] text-gray-400 mt-1 text-center">
          {recorder.error
            ? <span className="text-red-500">{recorder.error}</span>
            : recorder.state === 'recording'
              ? 'Micro pour envoyer · Corbeille pour annuler'
              : 'Entrée pour envoyer · Micro pour un vocal (max 2 min)'}
        </p>
      </div>
    </div>
  )
}
