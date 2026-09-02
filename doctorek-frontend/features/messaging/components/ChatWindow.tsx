'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Conversation, Message } from '@/lib/types'
import { getSession } from '@/lib/session'
import { Avatar } from '@/components/Avatar'
import { useMessages, useMarkRead } from '../hooks'
import { useChat } from '../useChat'
import { useStompContext } from '@/lib/stomp-context'
import { useAudioRecorder, MAX_AUDIO_SEC } from '../useAudioRecorder'
import { toast } from 'sonner'
import { MessageBubble } from './MessageBubble'
import { sendMessageRest, sendAudioMessage, sendAttachment, setPatientReply } from '../api'
import { ApiError } from '@/lib/api-client'
import LogoLoader from '@/components/LogoLoader'
import {
  ArrowUp,
  EllipsisVertical,
  Info,
  LockKeyhole,
  MessageCircle,
  Mic,
  Paperclip,
  Send,
  Trash2,
} from 'lucide-react'

const ACCEPTED_FILES = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

/** Message d'erreur lisible — remonte le message backend (429, quota, réponses coupées…). */
function toastError(e: unknown, fallback: string) {
  toast.error(e instanceof ApiError ? e.message : fallback)
}

interface ChatWindowProps {
  readonly conversation: Conversation
}

function getOtherName(conv: Conversation, myId: string) {
  return myId === conv.patientId ? conv.medecinName : conv.patientName
}

function dayKey(iso: string): string {
  const date = new Date(iso)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function formatDay(iso: string): string {
  const date = new Date(iso)
  const label = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return label.charAt(0).toLocaleUpperCase('fr-FR') + label.slice(1)
}

function makeOptimistic(conversationId: string, senderId: string, content: string): Message {
  return {
    id: `opt-${crypto.randomUUID()}`,
    conversationId,
    senderId,
    content,
    sentAt: new Date().toISOString(),
    readAt: null,
  }
}

// Fusionne serveur + optimiste ; retire l'optimiste dès que le serveur a le contenu.
function mergeMessages(serverMessages: Message[], optimistic: Message[]): Message[] {
  const serverIds = new Set(serverMessages.map((m) => m.id))
  const extras = optimistic.filter(
    (m) =>
      !serverIds.has(m.id) &&
      !serverMessages.some((s) => s.senderId === m.senderId && s.content === m.content),
  )
  return [...serverMessages].reverse().concat(extras)
}

/** Encapsule l'envoi (texte, vocal, document) + l'état optimiste, pour alléger le composant. */
function useComposer(conversation: Conversation, myId: string) {
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recorder = useAudioRecorder()

  const { data: serverMessages = [] } = useMessages(conversation.id)
  const allMessages = mergeMessages(serverMessages, optimisticMessages)

  const { connected, sendMessage } = useChat({
    conversationId: conversation.id,
    onMessage: (msg) => {
      setOptimisticMessages((prev) => prev.filter((m) => m.content !== msg.content))
      qc.invalidateQueries({ queryKey: ['messages', conversation.id] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  function dropOptimistic(id: string) {
    setOptimisticMessages((prev) => prev.filter((m) => m.id !== id))
  }

  function invalidateThread() {
    qc.invalidateQueries({ queryKey: ['messages', conversation.id] })
    qc.invalidateQueries({ queryKey: ['conversations'] })
  }

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return
    setInput('')
    setSending(true)

    const optimistic = makeOptimistic(conversation.id, myId, content)
    const clientMsgId = optimistic.id.replace('opt-', '')
    setOptimisticMessages((prev) => [...prev, optimistic])

    try {
      const sent = connected
        ? sendMessage(conversation.id, JSON.stringify({ conversationId: conversation.id, content, clientMsgId }))
        : false

      if (!sent) {
        const real = await sendMessageRest(conversation.id, content, clientMsgId)
        dropOptimistic(optimistic.id)
        qc.setQueryData<Message[]>(['messages', conversation.id], (old = []) => [...old, real])
        qc.invalidateQueries({ queryKey: ['conversations'] })
      }
    } catch (e) {
      dropOptimistic(optimistic.id)
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

  async function uploadAudio(blob: Blob, durationSec: number) {
    const optimistic = makeOptimistic(conversation.id, myId, '🎤 Envoi du vocal…')
    const clientMsgId = optimistic.id.replace('opt-', '')
    setOptimisticMessages((prev) => [...prev, optimistic])
    setUploadingAudio(true)
    try {
      await sendAudioMessage(conversation.id, blob, durationSec, clientMsgId)
      invalidateThread()
    } catch (e) {
      toastError(e, "Échec de l'envoi du vocal")
    } finally {
      dropOptimistic(optimistic.id)
      setUploadingAudio(false)
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

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de re-choisir le même fichier
    if (!file || uploadingDoc) return
    const optimistic = makeOptimistic(conversation.id, myId, `📎 Envoi de ${file.name}…`)
    const clientMsgId = optimistic.id.replace('opt-', '')
    setOptimisticMessages((prev) => [...prev, optimistic])
    setUploadingDoc(true)
    try {
      await sendAttachment(conversation.id, file, clientMsgId)
      invalidateThread()
    } catch (e) {
      toastError(e, "Échec de l'envoi du fichier")
    } finally {
      dropOptimistic(optimistic.id)
      setUploadingDoc(false)
    }
  }

  return {
    input, setInput, sending, uploadingAudio, uploadingDoc,
    allMessages, connected, recorder, fileInputRef,
    handleSend, handleKeyDown, handleMicToggle, handleFilePick,
  }
}

/** Gère le droit de réponse du patient côté médecin (optimiste + rollback). */
function useReplyControl(conversation: Conversation) {
  const qc = useQueryClient()
  const { subscribe } = useStompContext()
  const [canReply, setCanReply] = useState(conversation.patientCanReply)
  // Resynchronise si la prop change de valeur (pendant le rendu).
  const [prevConvReply, setPrevConvReply] = useState(conversation.patientCanReply)
  if (prevConvReply !== conversation.patientCanReply) {
    setPrevConvReply(conversation.patientCanReply)
    setCanReply(conversation.patientCanReply)
  }
  const [togglingReply, setTogglingReply] = useState(false)

  // Le médecin (dés)active les réponses : le backend pousse la conversation mise à jour,
  // le composer du patient suit immédiatement, sans refresh.
  useEffect(() => {
    return subscribe('/user/queue/conversations', (body) => {
      try {
        const updated: Conversation = JSON.parse(body)
        if (updated.id === conversation.id) {
          setCanReply(updated.patientCanReply)
        }
        qc.invalidateQueries({ queryKey: ['conversations'] })
      } catch {
        // trame malformée — ignore
      }
    })
  }, [conversation.id, subscribe, qc])

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

  return { canReply, togglingReply, handleToggleReply }
}

interface ReplyToggleProps {
  readonly canReply: boolean
  readonly togglingReply: boolean
  readonly onToggle: () => void
}

function ReplyToggle({ canReply, togglingReply, onToggle }: ReplyToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm font-medium text-[#66738F] lg:block">
        Réponses du patient {canReply ? 'activées' : 'bloquées'}
      </span>
      <button
        type="button"
        onClick={onToggle}
        disabled={togglingReply}
        aria-pressed={canReply}
        aria-label={canReply ? 'Désactiver les réponses du patient' : 'Activer les réponses du patient'}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007DFF]/15 disabled:opacity-50 ${
          canReply ? 'bg-[#1688F8]' : 'bg-[#C8D1DC]'
        }`}
        title="Autoriser ou bloquer les réponses du patient"
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${canReply ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

type Composer = ReturnType<typeof useComposer>

function RecordingBar({ composer }: { readonly composer: Composer }) {
  const { recorder, handleMicToggle } = composer
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#FEF2F2] px-3 py-2 ring-1 ring-[#FADCDC]">
      <button
        type="button"
        onClick={recorder.cancel}
        className="flex-none flex h-9 w-9 items-center justify-center rounded-full text-[#E01E5A] hover:bg-[#FFDEDE] transition-colors"
        aria-label="Annuler l'enregistrement"
      >
        <Trash2 className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
      <span className="flex-none h-2.5 w-2.5 rounded-full bg-[#E01E5A] animate-pulse" />
      <span className="flex-1 text-[13px] font-semibold text-[#B4144A] tabular-nums">
        {Math.floor(recorder.elapsed / 60)}:{(recorder.elapsed % 60).toString().padStart(2, '0')}
        <span className="text-[#E9899F]"> / {Math.floor(MAX_AUDIO_SEC / 60)}:00</span>
      </span>
      <button
        type="button"
        onClick={handleMicToggle}
        className="flex-none flex h-9 w-9 items-center justify-center rounded-full bg-[#007DFF] text-white shadow-sm hover:bg-[#00263C] transition-colors"
        aria-label="Envoyer le message vocal"
      >
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function DisabledNotice() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#F3F6FA] px-4 py-3 text-[13px] font-medium text-[#6B7A8D]">
      <LockKeyhole className="h-[15px] w-[15px]" aria-hidden="true" />
      Le médecin a désactivé les réponses sur cette conversation.
    </div>
  )
}

function InputBar({ composer }: { readonly composer: Composer }) {
  const {
    input, setInput, sending, uploadingAudio, uploadingDoc,
    fileInputRef, handleSend, handleKeyDown, handleMicToggle, handleFilePick,
  } = composer
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#D9E1EC] bg-white p-2 transition-[border-color,box-shadow] focus-within:border-[#B6DAF7] focus-within:ring-4 focus-within:ring-[#007DFF]/10">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILES}
        onChange={handleFilePick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadingDoc}
        className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-[#D9E1EC] bg-[#F8FAFC] text-[#66738F] transition-colors hover:border-[#B6DAF7] hover:bg-[#F0F7FF] hover:text-[#007DFF] disabled:opacity-40"
        aria-label="Joindre un document (PDF, JPEG, PNG)"
      >
        {uploadingDoc ? (
          <LogoLoader variant="mark" size={16} decorative />
        ) : (
          <Paperclip className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Écrire un message…"
        rows={1}
        aria-label="Écrire un message"
        className="max-h-32 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-[#1C2733] outline-none placeholder:text-[#9AA7B5]"
      />
      <button
        type="button"
        onClick={handleMicToggle}
        disabled={uploadingAudio}
        className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-[#D9E1EC] bg-[#F8FAFC] text-[#66738F] transition-colors hover:border-[#B6DAF7] hover:bg-[#F0F7FF] hover:text-[#007DFF] disabled:opacity-40"
        aria-label="Enregistrer un message vocal"
      >
        {uploadingAudio ? (
          <LogoLoader variant="mark" size={16} decorative />
        ) : (
          <Mic className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={handleSend}
        disabled={sending}
        aria-disabled={!input.trim() || sending}
        className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#007DFF] text-white shadow-sm transition-colors hover:bg-[#006EE6] disabled:opacity-50"
        aria-label="Envoyer"
      >
        <Send className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}

export function ChatWindow({ conversation }: ChatWindowProps) {
  const session = getSession()
  const myId = session?.id ?? ''
  const isMedecin = myId === conversation.medecinId

  const { canReply, togglingReply, handleToggleReply } = useReplyControl(conversation)
  const composerDisabled = !isMedecin && !canReply

  const composer = useComposer(conversation, myId)
  const { allMessages, connected, recorder } = composer

  const markReadMutation = useMarkRead(conversation.id)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Marque lu à l'ouverture et quand des messages arrivent
  useEffect(() => {
    if (conversation.unreadCount > 0) {
      markReadMutation.mutate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, conversation.unreadCount])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length])

  const composerHint = recorder.state === 'recording'
    ? 'Micro pour envoyer, corbeille pour annuler'
    : 'Entrée pour envoyer, micro pour un vocal (max 2 min)'

  const otherName = getOtherName(conversation, myId)
  const otherPhotoUrl = myId === conversation.patientId
    ? conversation.medecinPhotoUrl
    : conversation.patientPhotoUrl

  // Corps du composer sans ternaire imbriquée
  let composerBody: React.ReactNode
  if (recorder.state === 'recording') {
    composerBody = <RecordingBar composer={composer} />
  } else if (composerDisabled) {
    composerBody = <DisabledNotice />
  } else {
    composerBody = <InputBar composer={composer} />
  }

  return (
    <div className="flex h-full flex-col bg-[#FBFCFE]">
      {/* En-tête */}
      <div className="flex min-h-24 items-center gap-4 border-b border-[#DCE3ED] bg-white px-6 py-4">
        <div className="relative flex-none">
          <Avatar name={otherName} photoUrl={otherPhotoUrl} size={50} className="shadow-sm" />
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
              connected ? 'bg-[#2EB67D]' : 'bg-[#C7D0DA]'
            }`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold leading-tight text-[#010C2D]">{otherName}</p>
          <p className={`mt-1 text-sm font-medium ${connected ? 'text-[#2EB67D]' : 'text-[#9AA7B5]'}`}>
            {connected ? 'En ligne' : 'Hors ligne'}
          </p>
        </div>

        {/* Le médecin autorise / bloque les réponses du patient */}
        {isMedecin && (
          <ReplyToggle canReply={canReply} togglingReply={togglingReply} onToggle={handleToggleReply} />
        )}
        <button
          type="button"
          aria-label="Informations sur la conversation"
          title="Informations sur la conversation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#66738F] transition-colors hover:bg-[#F0F4F8] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007DFF]/10"
        >
          <Info className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Plus d’options"
          title="Plus d’options"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#66738F] transition-colors hover:bg-[#F0F4F8] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007DFF]/10"
        >
          <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {allMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF4FF] text-[#007DFF]">
              <MessageCircle className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#243547]">Démarrez la conversation</p>
              <p className="mt-0.5 text-[12px] text-[#9AA7B5]">Vos échanges sont privés et sécurisés.</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full flex-col">
            {allMessages.map((msg, index) => {
              const showDay = index === 0 || dayKey(msg.sentAt) !== dayKey(allMessages[index - 1].sentAt)
              return (
                <Fragment key={msg.id}>
                  {showDay && (
                    <div className="mb-5 flex items-center gap-4 text-xs font-medium text-[#66738F]">
                      <span className="h-px flex-1 bg-[#DCE3ED]" />
                      <span>{formatDay(msg.sentAt)}</span>
                      <span className="h-px flex-1 bg-[#DCE3ED]" />
                    </div>
                  )}
                  <MessageBubble message={msg} isMine={msg.senderId === myId} />
                </Fragment>
              )
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Zone de saisie */}
      <div className="border-t border-[#DCE3ED] bg-white px-6 py-4">
        {composerBody}
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
