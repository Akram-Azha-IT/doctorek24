'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X, RotateCcw, ShieldPlus } from 'lucide-react'
import type { AgentRdvBrouillon, AgentTour, BookingSlot } from '@/lib/types'
import { AgentThread } from './AgentThread'
import { AgentAccessGate } from './AgentAccessGate'

export type AccesAgent = 'patient' | 'anonyme' | 'autre-role'

interface AgentPanelProps {
  readonly acces: AccesAgent
  readonly loginHref: string
  readonly tours: AgentTour[]
  readonly enCours: boolean
  readonly onEnvoyer: (message: string) => void
  readonly onFermer: () => void
  readonly onReinitialiser: () => void
  readonly onReserver: (slot: BookingSlot) => void
  readonly onBrouillon: (brouillon: AgentRdvBrouillon) => void
}

/**
 * Espace de décision de l'agent.
 *
 * Le Care Path relie visuellement le besoin, les données vérifiées et l'action.
 * Le composeur est un sibling visuellement fusionné sous ce panneau.
 */
export function AgentPanel({
  acces,
  loginHref,
  tours,
  enCours,
  onEnvoyer,
  onFermer,
  onReinitialiser,
  onReserver,
  onBrouillon,
}: AgentPanelProps) {
  useEffect(() => {
    function surEchap(event: KeyboardEvent) {
      if (event.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', surEchap)
    return () => window.removeEventListener('keydown', surEchap)
  }, [onFermer])

  return (
    <section
      aria-label="Assistant Doctorek"
      className={`agent-panneau pointer-events-auto relative flex flex-col overflow-hidden border border-[#D8E3EE] bg-white shadow-[0_16px_60px_rgba(0,38,60,0.16)] ${acces === 'patient' ? 'w-[min(100%,28rem)] h-[min(60dvh,32.5rem)] rounded-t-[1.6rem] border-b-0' : 'w-[min(100%,42rem)] max-h-[calc(100dvh-6rem)] rounded-[1.6rem]'}`}
    >
      <header className="flex shrink-0 items-center gap-3 px-5 py-3">
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] bg-[#EBF5FF] ring-1 ring-[#DCEBFC]">
          <Image src="/icone-doctorek.png" alt="" width={31} height={31} className="h-7 w-7" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-[15px] font-semibold tracking-[-0.012em] text-[#010C2D] sm:text-[15.5px]">Assistant Doctorek</h2>
          </div>
          <p className="mt-0.5 text-xs text-[#53677B]">Assistant IA · Parcours patient</p>
        </div>

        <div className="flex items-center gap-2">
          {acces === 'patient' && (
            <button
              type="button"
              onClick={onReinitialiser}
              aria-label="Nouvelle conversation"
              title="Nouvelle conversation"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1F6FD] text-[#526274] transition-colors hover:bg-[#E3EEF9] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
            >
              <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer l'assistant"
            title="Fermer l'assistant"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#526274] transition-colors hover:bg-[#F1F6FD] hover:text-[#00263C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
          >
            <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className={`${acces === 'patient' ? 'dk-canvas' : 'bg-white'} flex min-h-0 flex-1 flex-col border-t border-[#E4ECF5]`}>
        {acces === 'patient' ? (
          <AgentThread
            tours={tours}
            enCours={enCours}
            onSuggestion={onEnvoyer}
            onReserver={onReserver}
            onBrouillon={onBrouillon}
          />
        ) : (
          <AgentAccessGate estConnecte={acces === 'autre-role'} loginHref={loginHref} />
        )}
      </div>

      <p className="flex shrink-0 items-center justify-center gap-2 border-t border-[#E7EEF6] bg-white px-4 py-3 text-center text-[11px] leading-snug text-[#53677B]">
        <ShieldPlus className="h-4 w-4 shrink-0 text-[#1863A9]" aria-hidden="true" />
        Assistant IA · Ne remplace pas un avis médical
      </p>
    </section>
  )
}
