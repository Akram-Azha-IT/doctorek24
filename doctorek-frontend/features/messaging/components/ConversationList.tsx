'use client'

import type { Conversation, Message } from '@/lib/types'
import { getSession } from '@/lib/session'
import { Avatar } from '@/components/Avatar'
import { FileText, MessageCircle, Mic } from 'lucide-react'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (conv: Conversation) => void
}

function formatRelative(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} h`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/** Le correspondant : le médecin si je suis le patient, et inversement. */
function getOther(conv: Conversation, myId: string) {
  return myId === conv.patientId
    ? { name: conv.medecinName, photoUrl: conv.medecinPhotoUrl }
    : { name: conv.patientName, photoUrl: conv.patientPhotoUrl }
}

function Preview({ last }: { readonly last: Message | null }) {
  if (!last) return <span className="italic text-[#9AA7B5]">Nouvelle conversation</span>
  if (last.messageType === 'AUDIO') {
    return (
      <span className="inline-flex items-center gap-1">
        <Mic className="h-3 w-3" aria-hidden="true" />
        Message vocal
      </span>
    )
  }
  if (last.messageType === 'DOCUMENT') {
    return (
      <span className="inline-flex items-center gap-1">
        <FileText className="h-3 w-3" aria-hidden="true" />
        {last.mediaFilename ?? 'Document'}
      </span>
    )
  }
  return <>{last.content}</>
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const session = getSession()
  const myId = session?.id ?? ''

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-[#9AA7B5]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF2F8]">
          <MessageCircle className="h-[22px] w-[22px]" aria-hidden="true" />
        </div>
        <p className="text-center text-[13px]">Aucune conversation pour le moment</p>
      </div>
    )
  }

  return (
    <ul>
      {conversations.map((conv) => {
        const other = getOther(conv, myId)
        const name = other.name
        const isSelected = conv.id === selectedId
        const unread = conv.unreadCount > 0
        return (
          <li key={conv.id} className="border-b border-[#E7ECF2] last:border-b-0">
            <button
              onClick={() => onSelect(conv)}
              className={`relative flex w-full items-center gap-3 px-6 py-4 text-left transition-colors ${
                isSelected ? 'bg-[#F1F7FF]' : 'hover:bg-[#F8FAFC]'
              }`}
            >
              {isSelected && <span className="absolute inset-y-2 left-3 w-1 rounded-full bg-[#007DFF]" />}
              <span className="relative shrink-0">
                <Avatar name={name} photoUrl={other.photoUrl} size={48} ring className="shadow-sm" />
                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isSelected ? 'bg-[#2EB67D]' : 'bg-[#C8D1DC]'}`} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`truncate text-[15px] ${unread ? 'font-bold text-[#010C2D]' : 'font-semibold text-[#243547]'}`}>{name}</span>
                  <span className={`flex-none text-xs tabular-nums ${unread ? 'font-semibold text-[#007DFF]' : 'text-[#8290A8]'}`}>
                    {formatRelative(conv.lastMessageAt)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className={`truncate text-[13px] ${unread ? 'text-[#465058]' : 'text-[#75839A]'}`}>
                    <Preview last={conv.lastMessage} />
                  </span>
                  {unread && (
                    <span className="flex-none flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-[#007DFF] px-1.5 text-[10px] font-bold text-white">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
