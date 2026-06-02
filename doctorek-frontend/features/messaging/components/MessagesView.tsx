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

  return (
    <div className="flex h-full bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Conversation list */}
      <aside className="w-72 flex-none border-r border-gray-100 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#333333]">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-[#007DFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedConv?.id ?? null}
              onSelect={setSelectedConv}
            />
          )}
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {selectedConv ? (
          <ChatWindow key={selectedConv.id} conversation={selectedConv} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
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
