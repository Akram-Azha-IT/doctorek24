'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { Minus, RotateCcw } from 'lucide-react'
import type { AgentRdvBrouillon, AgentTour, BookingSlot } from '@/lib/types'
import { AgentThread } from './AgentThread'
import { AgentAccessGate } from './AgentAccessGate'

export type AccesAgent = 'patient' | 'anonyme' | 'autre-role'

interface AgentPanelProps {
  readonly acces: AccesAgent
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
        className="agent-panneau pointer-events-auto relative flex h-[min(72dvh,35.5rem)] w-[min(100%,31.5rem)] flex-col overflow-hidden rounded-t-[1.6rem] border border-b-0 border-[#D8E3EE] bg-white shadow-[0_22px_60px_rgba(1,12,45,0.20)] sm:h-[min(64vh,32.5rem)]"
    >
      <div className="h-1 shrink-0 bg-[#007DFF]" aria-hidden="true" />

      <header className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] bg-[#EBF5FF] ring-1 ring-[#DCEBFC]">
          <Image src="/icone-doctorek.png" alt="" width={31} height={31} className="h-7 w-7" />
          <span className="absolute -bottom-0.5 -right-1 h-3 w-3 rounded-full border-2 border-white bg-[#2EB67D]" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-[15px] font-semibold tracking-[-0.012em] text-[#010C2D] sm:text-[15.5px]">Assistant Doctorek</h2>
          </div>
          <p className="mt-0.5 text-[11.5px] text-[#667585] sm:text-[12px]">Votre parcours de soin</p>
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
            aria-label="Réduire l'assistant"
            title="Réduire l'assistant"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F1F6FD] text-[#526274] transition-colors hover:bg-[#E3EEF9] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
          >
            <Minus className="h-[19px] w-[19px]" strokeWidth={2} aria-hidden="true" />
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
          <AgentAccessGate estConnecte={acces === 'autre-role'} />
        )}
      </div>

      <p className="border-t border-[#E7EEF6] bg-white px-4 py-2 text-center text-[10.5px] leading-snug text-[#53677B]">
        Données vérifiées dans Doctorek · Ne remplace pas un avis médical
      </p>
    </section>
  )
}
