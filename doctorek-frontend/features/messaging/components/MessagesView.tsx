'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Conversation } from '@/lib/types'
import { useConversations } from '../hooks'
import { ConversationList } from './ConversationList'
import { ChatWindow } from './ChatWindow'
import { NewConversationButton } from './NewConversationButton'
import LogoLoader from '@/components/LogoLoader'

function MessagesContent() {
  const searchParams = useSearchParams()
  const convParam = searchParams.get('conv')
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const { data: conversations = [], isLoading } = useConversations()

  // Deep link ?conv=<id> : sélection pendant le rendu (pattern "derive state from props").
  const [appliedConvParam, setAppliedConvParam] = useState<string | null>(null)
  if (convParam && convParam !== appliedConvParam && conversations.length) {
    const match = conversations.find((c) => c.id === convParam)
    if (match) {
      setAppliedConvParam(convParam)
      setSelectedConv(match)
    }
  }

  function handleSelect(conv: Conversation) {
    setSelectedConv(conv)
  }

  function handleBack() {
    setSelectedConv(null)
  }

  return (
    <div className="flex h-full overflow-hidden bg-white ring-1 ring-[#E7ECF2] rounded-none sm:rounded-2xl shadow-none sm:shadow-[0_2px_16px_rgba(1,12,45,0.05)]">

      {/* Panneau liste des conversations. Desktop: toujours visible. Mobile: si aucune sélection. */}
      <aside className={`
        flex-col border-r border-[#E7ECF2] bg-white
        w-full sm:w-[19rem] sm:flex-none sm:flex
        ${selectedConv ? 'hidden sm:flex' : 'flex'}
      `}>
        <div className="flex items-center justify-between gap-2 border-b border-[#E7ECF2] px-4 py-3.5">
          <div>
            <h2 className="text-[15px] font-bold text-[#010C2D]">Messagerie</h2>
            <p className="text-[11px] text-[#9AA7B5]">Échanges sécurisés</p>
          </div>
          <NewConversationButton onStarted={handleSelect} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LogoLoader width={100} label="Chargement des conversations…" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF4FF] flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700">Aucune conversation</p>
              <p className="text-xs text-zinc-400 mt-1 mb-3">Contactez un médecin avec qui vous avez un rendez-vous.</p>
              <NewConversationButton onStarted={handleSelect} />
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedConv?.id ?? null}
              onSelect={handleSelect}
            />
          )}
        </div>
      </aside>

      {/* ── Chat panel ─────────────────────────────── */}
      {/* Desktop: always visible. Mobile: only when conv selected */}
      <main className={`
        flex-1 flex flex-col min-w-0
        ${selectedConv ? 'flex' : 'hidden sm:flex'}
      `}>
        {selectedConv ? (
          <>
            {/* Mobile back button */}
            <div className="sm:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Retour à la liste des conversations"
                className="cursor-pointer flex items-center justify-center h-9 w-9 rounded-xl text-zinc-500 hover:bg-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#010C2D] truncate">{selectedConv.medecinName || selectedConv.patientName}</p>
                <p className="text-xs text-zinc-400">Conversation</p>
              </div>
            </div>
            <ChatWindow key={selectedConv.id} conversation={selectedConv} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#F7F9FC] text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#007DFF] ring-1 ring-[#E7ECF2] shadow-sm">
              <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M21 12a9 9 0 11-3.6-7.2L21 3v9z" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#243547]">Sélectionnez une conversation</p>
              <p className="mt-1 text-[12.5px] text-[#9AA7B5]">Choisissez un échange dans la liste pour l&apos;ouvrir.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export function MessagesView() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <LogoLoader width={100} label="Chargement des messages…" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
