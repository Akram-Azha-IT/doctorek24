'use client'

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Conversation, Message } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useMessages, useMarkRead } from '../hooks'
import { useChat } from '../useChat'
import { useAudioRecorder, MAX_AUDIO_SEC } from '../useAudioRecorder'
import { toast } from 'sonner'
import { MessageBubble } from './MessageBubble'
import { sendMessageRest, sendAudioMessage, sendAttachment, setPatientReply } from '../api'
import { ApiError } from '@/lib/api-client'

const ACCEPTED_FILES = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

/** Message d'erreur lisible — remonte le message backend (429, quota, réponses coupées…). */
function toastError(e: unknown, fallback: string) {
  toast.error(e instanceof ApiError ? e.message : fallback)
}

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

  const isMedecin = myId === conversation.medecinId
  const [canReply, setCanReply] = useState(conversation.patientCanReply)
  // Resynchronise si la conversation (prop) change de valeur — pendant le rendu.
  const [prevConvReply, setPrevConvReply] = useState(conversation.patientCanReply)
  if (prevConvReply !== conversation.patientCanReply) {
    setPrevConvReply(conversation.patientCanReply)
    setCanReply(conversation.patientCanReply)
  }
  const [togglingReply, setTogglingReply] = useState(false)
  // Le patient est bloqué si le médecin a coupé les réponses.
  const composerDisabled = !isMedecin && !canReply

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
    } catch (e) {
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      toastError(e, "Échec de l'envoi du message")
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
    } catch (e) {
      toastError(e, "Échec de l'envoi du vocal")
    } finally {
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setUploadingAudio(false)
    }
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de re-choisir le même fichier
    if (!file || uploadingDoc) return
    const clientMsgId = crypto.randomUUID()
    const optimistic: Message = {
      id: `opt-${clientMsgId}`,
      conversationId: conversation.id,
      senderId: myId,
      messageType: 'TEXT',
      content: `📎 Envoi de ${file.name}…`,
      sentAt: new Date().toISOString(),
      readAt: null,
    }
    setOptimisticMessages((prev) => [...prev, optimistic])
    setUploadingDoc(true)
    try {
      await sendAttachment(conversation.id, file, clientMsgId)
      qc.invalidateQueries({ queryKey: ['messages', conversation.id] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    } catch (e) {
      toastError(e, "Échec de l'envoi du fichier")
    } finally {
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setUploadingDoc(false)
    }
  }

  async function handleToggleReply() {
    if (togglingReply) return
    const next = !canReply
    setCanReply(next) // optimiste
    setTogglingReply(true)
    try {
      await setPatientReply(conversation.id, next)
      qc.invalidateQueries({ queryKey: ['conversations'] })
    } catch (e) {
      setCanReply(!next) // rollback
      toastError(e, 'Échec de la mise à jour')
    } finally {
      setTogglingReply(false)
    }
  }

  const composerHint = recorder.state === 'recording'
    ? 'Micro pour envoyer, corbeille pour annuler'
    : 'Entrée pour envoyer, micro pour un vocal (max 2 min)'

  const otherName = getOtherName(conversation, myId)
  const otherInitials = otherName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex h-full flex-col bg-[#F7F9FC]">
      {/* En-tête */}
      <div className="flex items-center gap-3 border-b border-[#E7ECF2] bg-white px-5 py-3">
        <div className="relative flex-none">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#007DFF] text-sm font-semibold text-white shadow-sm">
            {otherInitials}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
              connected ? 'bg-[#2EB67D]' : 'bg-[#C7D0DA]'
            }`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold leading-tight text-[#010C2D]">{otherName}</p>
          <p className={`text-[11.5px] font-medium ${connected ? 'text-[#2EB67D]' : 'text-[#9AA7B5]'}`}>
            {connected ? 'En ligne' : 'Hors ligne'}
          </p>
        </div>

        {/* Le médecin autorise / bloque les réponses du patient */}
        {isMedecin && (
          <button
            type="button"
            onClick={handleToggleReply}
            disabled={togglingReply}
            aria-pressed={canReply}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
              canReply
                ? 'bg-[#DFEFFE] text-[#007DFF] hover:bg-[#B6DAF7]'
                : 'bg-[#FFDEDE] text-[#E01E5A] hover:bg-[#ffc9c9]'
            }`}
            title="Autoriser ou bloquer les réponses du patient"
          >
            {canReply ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" /></svg>
                Réponses activées
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" /></svg>
                Réponses bloquées
              </>
            )}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {allMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF4FF] text-[#007DFF]">
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M21 12a9 9 0 11-3.6-7.2L21 3v9z" /></svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#243547]">Démarrez la conversation</p>
              <p className="mt-0.5 text-[12px] text-[#9AA7B5]">Vos échanges sont privés et sécurisés.</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col">
            {allMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isMine={msg.senderId === myId} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Zone de saisie */}
      <div className="border-t border-[#E7ECF2] bg-white px-4 py-3">
        {recorder.state === 'recording' ? (
          /* Barre d'enregistrement vocal */
          <div className="flex items-center gap-3 rounded-2xl bg-[#FEF2F2] px-3 py-2 ring-1 ring-[#FADCDC]">
            <button
              onClick={recorder.cancel}
              className="flex-none flex h-9 w-9 items-center justify-center rounded-full text-[#E01E5A] hover:bg-[#FFDEDE] transition-colors"
              aria-label="Annuler l'enregistrement"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-9 0v14a2 2 0 002 2h6a2 2 0 002-2V6" />
              </svg>
            </button>
            <span className="flex-none h-2.5 w-2.5 rounded-full bg-[#E01E5A] animate-pulse" />
            <span className="flex-1 text-[13px] font-semibold text-[#B4144A] tabular-nums">
              {Math.floor(recorder.elapsed / 60)}:{(recorder.elapsed % 60).toString().padStart(2, '0')}
              <span className="text-[#E9899F]"> / {Math.floor(MAX_AUDIO_SEC / 60)}:00</span>
            </span>
            <button
              onClick={handleMicToggle}
              className="flex-none flex h-9 w-9 items-center justify-center rounded-full bg-[#007DFF] text-white shadow-sm hover:bg-[#00263C] transition-colors"
              aria-label="Envoyer le message vocal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : composerDisabled ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#F3F6FA] px-4 py-3 text-[13px] font-medium text-[#6B7A8D]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            Le médecin a désactivé les réponses sur cette conversation.
          </div>
        ) : (
          <div className="flex items-end gap-1.5 rounded-2xl bg-[#F3F6FA] px-2 py-1.5 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-[#007DFF]/30">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILES}
              onChange={handleFilePick}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingDoc}
              className="flex-none flex h-9 w-9 items-center justify-center rounded-full text-[#6B7A8D] hover:bg-[#EAF4FF] hover:text-[#007DFF] disabled:opacity-40 transition-colors"
              aria-label="Joindre un document (PDF, JPEG, PNG)"
            >
              {uploadingDoc ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              )}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message…"
              rows={1}
              className="flex-1 resize-none bg-transparent py-1.5 text-[13.5px] text-[#1c2733] placeholder-[#9AA7B5] focus:outline-none max-h-32"
            />
            {input.trim() ? (
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-none flex h-9 w-9 items-center justify-center rounded-full bg-[#007DFF] text-white shadow-sm transition-colors hover:bg-[#00263C] disabled:opacity-40"
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
                className="flex-none flex h-9 w-9 items-center justify-center rounded-full bg-[#007DFF] text-white shadow-sm transition-colors hover:bg-[#00263C] disabled:opacity-40"
                aria-label="Enregistrer un message vocal"
              >
                {uploadingAudio ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                    <path strokeLinecap="round" d="M19 10v2a7 7 0 01-14 0v-2M12 19v4" />
                  </svg>
                )}
              </button>
            )}
          </div>
        )}
        {!composerDisabled && (
          <p className="text-[10px] text-gray-400 mt-1 text-center">
            {recorder.error ? (
              <span className="text-red-500">{recorder.error}</span>
            ) : (
              composerHint
            )}
          </p>
        )}
      </div>
    </div>
  )
}
