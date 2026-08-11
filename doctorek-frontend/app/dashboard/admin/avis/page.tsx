'use client'

import { useState } from 'react'
import { EyeOff, RotateCcw, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useFileModeration, useModererAvis } from '@/features/avis/hooks'
import { StarRating } from '@/features/avis/components/StarRating'
import type { Avis } from '@/lib/types'

// Clés stables pour les puces de chargement : un index de tableau se réattribuerait
// à une autre puce dès que la liste change.
const SQUELETTES = ['moderation-1', 'moderation-2', 'moderation-3'] as const

const STATUT_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  SIGNALE: { label: 'Signalé, toujours visible', bg: '#FFF4E5', text: '#8A5A00' },
  MASQUE: { label: 'Masqué', bg: '#F4F6F9', text: '#465058' },
}

export default function AdminAvisPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useFileModeration(page)
  const moderer = useModererAvis()

  function decider(avis: Avis, statut: 'MASQUE' | 'PUBLIE') {
    moderer.mutate(
      { avisId: avis.id, statut },
      {
        onSuccess: () =>
          toast.success(statut === 'MASQUE' ? 'Avis masqué' : 'Avis republié'),
        onError: () => toast.error("La décision n'a pas pu être enregistrée"),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {SQUELETTES.map((cle) => (
          <div key={cle} className="h-28 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-600">
        La file de modération n&apos;a pas pu être chargée.
      </p>
    )
  }

  if (data.content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#007DFF]/10">
          <Star className="h-7 w-7 text-[#007DFF]" />
        </div>
        <p className="text-sm font-medium text-zinc-500">Aucun avis à examiner</p>
        <p className="mt-1 text-xs text-zinc-400">
          Les avis signalés par un patient ou un médecin arrivent ici.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        Un signalement ne dépublie pas l&apos;avis : il reste visible tant qu&apos;un
        administrateur ne l&apos;a pas masqué.
      </p>

      <ul className="flex flex-col gap-3">
        {data.content.map((avis) => {
          const style = STATUT_STYLE[avis.statut] ?? STATUT_STYLE.SIGNALE
          return (
            <li
              key={avis.id}
              className="rounded-2xl border border-zinc-100 bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <StarRating value={avis.note} size="sm" />
                <span className="text-sm font-semibold text-[#010C2D]">{avis.auteur}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: style.bg, color: style.text }}
                >
                  {style.label}
                </span>
                <span className="text-xs text-zinc-400">
                  {new Date(avis.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {avis.commentaire ? (
                <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-zinc-600">
                  {avis.commentaire}
                </p>
              ) : (
                <p className="mt-2.5 text-sm italic text-zinc-400">Note sans commentaire</p>
              )}

              <div className="mt-3.5 flex flex-wrap gap-2">
                {avis.statut !== 'MASQUE' && (
                  <button
                    type="button"
                    onClick={() => decider(avis, 'MASQUE')}
                    disabled={moderer.isPending}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#FFDEDE] bg-white px-3 py-2 text-xs font-semibold text-[#B4232A] transition-colors hover:bg-[#FFF5F5] disabled:opacity-40"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    Masquer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => decider(avis, 'PUBLIE')}
                  disabled={moderer.isPending}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#EBF4FF] px-3 py-2 text-xs font-semibold text-[#007DFF] transition-colors hover:bg-[#DFEFFE] disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {avis.statut === 'MASQUE' ? 'Republier' : 'Signalement infondé'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {data.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Pagination">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-xs text-zinc-500 tabular-nums">
            Page {page} sur {data.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-40"
          >
            Suivant
          </button>
        </nav>
      )}
    </div>
  )
}
