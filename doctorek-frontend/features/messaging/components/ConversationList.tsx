'use client'

import type { Conversation } from '@/lib/types'
import { getSession } from '@/lib/session'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (conv: Conversation) => void
}

function formatRelative(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'À l\'instant'
  if (diffMin < 60) return `${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} h`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function getOtherName(conv: Conversation, myId: string) {
  return myId === conv.patientId ? conv.medecinName : conv.patientName
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const session = getSession()
  const myId = session?.id ?? ''

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 p-8">
        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-sm text-center">Aucune conversation pour le moment</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-100">
      {conversations.map((conv) => {
        const name = getOtherName(conv, myId)
        const isSelected = conv.id === selectedId
        return (
          <li key={conv.id}>
            <button
              onClick={() => onSelect(conv)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isSelected ? 'bg-[#DFEFFE]' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex-none w-10 h-10 rounded-full bg-[#007DFF] flex items-center justify-center text-white text-sm font-semibold">
                {initials(name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[#333333] text-sm truncate">{name}</span>
                  <span className="flex-none text-[11px] text-gray-400">
                    {formatRelative(conv.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-gray-500 truncate">
                    {conv.lastMessage?.content ?? 'Démarrez la conversation'}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="flex-none min-w-[18px] h-[18px] rounded-full bg-[#007DFF] text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
