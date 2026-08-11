'use client'

import { useState } from 'react'
import type { Avis } from '@/lib/types'
import { useSignalerAvis } from '../hooks'
import { StarRating } from './StarRating'

function moisAnnee(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

/** Initiales du libellé d'auteur — « Akram B. » donne « AB », « Patient vérifié » donne « PV ». */
function initiales(auteur: string): string {
  return auteur
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join('')
}

export function AvisList({ avis, medecinId }: Readonly<{ avis: Avis[]; medecinId: string }>) {
  if (avis.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-400">
        Aucun avis publié pour le moment.
      </p>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-100">
      {avis.map((a) => (
        <AvisItem key={a.id} avis={a} medecinId={medecinId} />
      ))}
    </ul>
  )
}

function AvisItem({ avis, medecinId }: Readonly<{ avis: Avis; medecinId: string }>) {
  const [signale, setSignale] = useState(false)
  const signaler = useSignalerAvis(medecinId)

  function onSignaler() {
    signaler.mutate(
      { avisId: avis.id },
      {
        onSuccess: () => setSignale(true),
        // Déjà signalé par ce compte : l'intention est satisfaite, on l'affiche comme telle.
        onError: () => setSignale(true),
      },
    )
  }

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#1863A9]"
          style={{ background: 'rgba(0,125,255,0.1)' }}
          aria-hidden="true"
        >
          {initiales(avis.auteur)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-zinc-800">{avis.auteur}</span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: 'rgba(46,182,125,0.12)', color: '#1E7A55' }}
            >
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Consultation vérifiée
            </span>
            <span className="text-xs text-zinc-400">· {moisAnnee(avis.createdAt)}</span>
          </div>

          <div className="mt-1.5">
            <StarRating value={avis.note} size="sm" />
          </div>

          {avis.commentaire && (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600">
              {avis.commentaire}
            </p>
          )}

          <div className="mt-2">
            {signale ? (
              <span className="text-[11px] text-zinc-400">Signalé, en cours d&apos;examen</span>
            ) : (
              <button
                type="button"
                onClick={onSignaler}
                disabled={signaler.isPending}
                className="cursor-pointer rounded text-[11px] text-zinc-400 underline-offset-2 transition-colors hover:text-zinc-600 hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
              >
                Signaler cet avis
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
