'use client'

import { useEffect, useRef } from 'react'
import { ListeAttenteForm } from './ListeAttenteForm'

interface ListeAttenteDialogProps {
  readonly medecinId: string
  readonly patientId: string | null
  readonly medecinNom: string
  readonly returnUrl?: string
  readonly onClose: () => void
}

/**
 * Inscription en liste d'attente sans quitter les résultats de recherche.
 *
 * <p>Le patient réserve depuis la recherche : l'envoyer sur la page du médecin pour
 * s'inscrire lui faisait perdre ses résultats et ses filtres. La fenêtre le garde
 * dans son parcours.
 */
export function ListeAttenteDialog({
  medecinId,
  patientId,
  medecinNom,
  returnUrl,
  onClose,
}: ListeAttenteDialogProps) {
  const fermerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const surEchap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', surEchap)
    fermerRef.current?.focus()
    return () => document.removeEventListener('keydown', surEchap)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#010C2D]/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <dialog
        open
        aria-labelledby="liste-attente-titre"
        onClick={(e) => e.stopPropagation()}
        className="m-0 w-full max-w-lg rounded-t-3xl bg-white p-0 text-left shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EEF1F6] px-5 py-4">
          <div className="min-w-0">
            <h2 id="liste-attente-titre" className="text-base font-bold text-[#010C2D]">
              Être prévenu d&apos;une annulation
            </h2>
            <p className="mt-0.5 truncate text-xs text-[#6B7A99]">{medecinNom}</p>
          </div>
          <button
            ref={fermerRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8A97A6] transition-colors hover:bg-[#F0F2F5] hover:text-[#010C2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/40"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5">
          <ListeAttenteForm
            medecinId={medecinId}
            patientId={patientId}
            returnUrl={returnUrl}
            onDone={onClose}
          />
        </div>
      </dialog>
    </div>
  )
}
