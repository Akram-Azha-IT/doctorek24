'use client'

import { Suspense, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'
import type { Conversation } from '@/lib/types'
import { useConversations } from '../hooks'
import { ConversationList } from './ConversationList'
import { ChatWindow } from './ChatWindow'
import { NewConversationButton } from './NewConversationButton'
import LogoLoader from '@/components/LogoLoader'
import { ErrorState } from '@/components/ErrorState'
import { ResilientState } from '@/components/ResilientState'

function MessagesContent() {
  const searchParams = useSearchParams()
  const convParam = searchParams.get('conv')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isChatDismissed, setIsChatDismissed] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const {
    data: conversations = [],
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useConversations()

  const selectedConv = useMemo(() => {
    if (convParam) {
      return conversations.find((conversation) => conversation.id === convParam) ?? null
    }
    if (isChatDismissed) return null
    return conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0] ?? null
  }, [convParam, conversations, isChatDismissed, selectedId])

  const filteredConversations = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('fr-FR')
    if (!needle) return conversations
    return conversations.filter((conversation) => {
      const preview = conversation.lastMessage?.content ?? conversation.lastMessage?.mediaFilename ?? ''
      return `${conversation.medecinName} ${conversation.patientName} ${preview}`
        .toLocaleLowerCase('fr-FR')
        .includes(needle)
    })
  }, [conversations, search])

  function handleSelect(conv: Conversation) {
    setSelectedId(conv.id)
    setIsChatDismissed(false)
  }

  function handleBack() {
    setIsChatDismissed(true)
  }

  return (
    <div className="flex h-full overflow-hidden bg-white">

      {/* Panneau liste des conversations. Desktop: toujours visible. Mobile: si aucune sélection. */}
      <aside className={`
        flex-col border-r border-[#E7ECF2] bg-white
        w-full sm:w-[24rem] sm:flex-none sm:flex
        ${selectedConv ? 'hidden sm:flex' : 'flex'}
      `}>
        <div className="border-b border-[#DCE3ED] px-6 pb-5 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-[-0.02em] text-[#010C2D]">Messagerie</h2>
              <p className="mt-0.5 text-sm text-[#8290A8]">Échanges sécurisés</p>
            </div>
            <NewConversationButton
              variant="icon"
              onDoctorAction={() => searchRef.current?.focus()}
              onStarted={handleSelect}
            />
          </div>

          <label className="mt-5 flex h-11 items-center gap-2.5 rounded-xl border border-[#D9E1EC] bg-[#F8FAFC] px-3.5 transition-[border-color,box-shadow] focus-within:border-[#007DFF] focus-within:ring-4 focus-within:ring-[#007DFF]/10">
            <Search className="h-4 w-4 shrink-0 text-[#8290A8]" aria-hidden="true" />
            <span className="sr-only">Rechercher dans les messages</span>
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher dans les messages…"
              className="min-w-0 flex-1 bg-transparent text-sm text-[#243547] outline-none placeholder:text-[#9AA7B5]"
            />
          </label>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LogoLoader width={100} label="Chargement des conversations…" />
            </div>
          ) : isError ? (
            <ErrorState error={error} onRetry={() => refetch()} isRetrying={isFetching} compact />
          ) : conversations.length === 0 ? (
            <ResilientState
              compact
              surface="plain"
              variant="empty"
              title="Aucune conversation"
              description="Vos échanges apparaîtront ici après avoir contacté un professionnel de santé."
              actions={<NewConversationButton onStarted={handleSelect} />}
            />
          ) : filteredConversations.length === 0 ? (
            <ResilientState
              compact
              surface="plain"
              showIllustration={false}
              variant="missing"
              title="Aucun résultat"
              description="Essayez un autre nom ou mot-clé."
              primaryAction={{ label: 'Effacer la recherche', onClick: () => setSearch('') }}
            />
          ) : (
            <ConversationList
              conversations={filteredConversations}
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
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#010C2D] truncate">{selectedConv.medecinName || selectedConv.patientName}</p>
                <p className="text-xs text-zinc-400">Conversation</p>
              </div>
            </div>
            <ChatWindow key={selectedConv.id} conversation={selectedConv} />
          </>
        ) : (
          <ResilientState
            compact
            surface="plain"
            variant="missing"
            title="Sélectionnez une conversation"
            description="Choisissez un échange dans la liste pour l’ouvrir."
            className="flex-1 bg-[#F7F9FC]"
          />
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
