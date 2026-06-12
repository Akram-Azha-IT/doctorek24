'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Conversation } from '@/lib/types'
import { useConversations } from '../hooks'
import { ConversationList } from './ConversationList'
import { ChatWindow } from './ChatWindow'

function MessagesContent() {
  const searchParams = useSearchParams()
  const convParam = searchParams.get('conv')
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const { data: conversations = [], isLoading } = useConversations()

  useEffect(() => {
    if (!convParam || !conversations.length) return
    const match = conversations.find((c) => c.id === convParam)
    if (match) setSelectedConv(match)
  }, [convParam, conversations])

  function handleSelect(conv: Conversation) {
    setSelectedConv(conv)
  }

  function handleBack() {
    setSelectedConv(null)
  }

  return (
    <div className="flex h-full bg-white rounded-none sm:rounded-2xl shadow-none sm:shadow-sm overflow-hidden">

      {/* ── Conversation list panel ─────────────────────────────── */}
      {/* Desktop: always visible. Mobile: only when no conv selected */}
      <aside className={`
        flex-col border-r border-gray-100
        w-full sm:w-72 sm:flex-none sm:flex
        ${selectedConv ? 'hidden sm:flex' : 'flex'}
      `}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#333333]">Messages</h2>
          {conversations.length > 0 && (
            <span className="text-xs font-semibold text-zinc-400">
              {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-[#007DFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF4FF] flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700">Aucune conversation</p>
              <p className="text-xs text-zinc-400 mt-1">Prenez un RDV pour démarrer une conversation avec un médecin.</p>
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
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-[#333333]">Sélectionnez une conversation</p>
              <p className="text-xs mt-1 text-gray-400">Choisissez dans la liste à gauche</p>
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
        <div className="w-5 h-5 border-2 border-[#007DFF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
