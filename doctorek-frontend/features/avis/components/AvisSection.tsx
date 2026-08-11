'use client'

import { useState } from 'react'
import { useAvisMedecin } from '../hooks'
import { AvisList } from './AvisList'
import { AvisSynthese } from './AvisSynthese'

/**
 * Section « Avis » du profil médecin : synthèse, liste paginée.
 *
 * Le dépôt ne se fait pas ici mais depuis les rendez-vous du patient — un avis
 * s'attache à une consultation précise, pas à un médecin en général.
 */
export function AvisSection({ medecinId }: { medecinId: string }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useAvisMedecin(medecinId, page)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Chargement des avis">
        <div className="h-20 animate-pulse rounded-lg bg-zinc-100" />
        <div className="h-14 animate-pulse rounded-lg bg-zinc-100" />
      </div>
    )
  }

  if (isError || !data) {
    return <p className="py-4 text-sm text-zinc-400">Les avis n&apos;ont pas pu être chargés.</p>
  }

  return (
    <div className="flex flex-col gap-5">
      <AvisSynthese
        noteMoyenne={data.noteMoyenne}
        nombreAvis={data.nombreAvis}
        repartition={data.repartition}
      />

      {data.nombreAvis > 0 && (
        <>
          <div className="border-t border-zinc-100 pt-4">
            <AvisList avis={data.content} medecinId={medecinId} />
          </div>

          {data.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-3" aria-label="Pagination des avis">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
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
                className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
              >
                Suivant
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
