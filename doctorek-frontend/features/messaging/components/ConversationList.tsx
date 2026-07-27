'use client'

import type { Conversation, Message } from '@/lib/types'
import { getSession } from '@/lib/session'
import { Avatar } from '@/components/Avatar'

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
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path strokeLinecap="round" d="M19 10v2a7 7 0 01-14 0v-2" /></svg>
        Message vocal
      </span>
    )
  }
  if (last.messageType === 'DOCUMENT') {
    return (
      <span className="inline-flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
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
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-center text-[13px]">Aucune conversation pour le moment</p>
      </div>
    )
  }

  return (
    <ul className="py-1">
      {conversations.map((conv) => {
        const other = getOther(conv, myId)
        const name = other.name
        const isSelected = conv.id === selectedId
        const unread = conv.unreadCount > 0
        return (
          <li key={conv.id} className="px-2">
            <button
              onClick={() => onSelect(conv)}
              className={`relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                isSelected ? 'bg-[#EAF4FF]' : 'hover:bg-[#F4F7FA]'
              }`}
            >
              {isSelected && <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-full bg-[#007DFF]" />}
              <Avatar name={name} photoUrl={other.photoUrl} size={44} ring className="shadow-sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`truncate text-[14px] ${unread ? 'font-bold text-[#010C2D]' : 'font-semibold text-[#243547]'}`}>{name}</span>
                  <span className={`flex-none text-[11px] tabular-nums ${unread ? 'font-semibold text-[#007DFF]' : 'text-[#9AA7B5]'}`}>
                    {formatRelative(conv.lastMessageAt)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className={`truncate text-[12.5px] ${unread ? 'text-[#465058]' : 'text-[#8A97A6]'}`}>
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
