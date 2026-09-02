'use client'

import { StarRating } from './StarRating'
import { ResilientState } from '@/components/ResilientState'

/**
 * Moyenne et histogramme des notes.
 *
 * La moyenne est mise à l'échelle typographique du bloc : c'est l'information qu'un
 * patient cherche en une seconde, la répartition ne vient qu'ensuite la nuancer.
 */
export function AvisSynthese({
  noteMoyenne,
  nombreAvis,
  repartition,
}: Readonly<{
  noteMoyenne: number | null
  nombreAvis: number
  repartition: number[]
}>) {
  if (!noteMoyenne || nombreAvis === 0) {
    return (
      <ResilientState
        compact
        surface="plain"
        variant="empty"
        title="Aucun avis pour le moment"
        description="Les avis apparaîtront ici après une consultation vérifiée."
      />
    )
  }

  const maximum = Math.max(...repartition, 1)

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <span className="text-4xl font-bold leading-none text-zinc-900 tabular-nums">
          {noteMoyenne.toFixed(1)}
        </span>
        <StarRating value={noteMoyenne} size="lg" />
        <span className="text-xs text-zinc-500">
          {nombreAvis} avis {nombreAvis > 1 ? 'vérifiés' : 'vérifié'}
        </span>
      </div>

      <div className="flex-1">
        {[5, 4, 3, 2, 1].map((note) => {
          const total = repartition[note - 1] ?? 0
          const largeur = (total / maximum) * 100
          return (
            <div key={note} className="flex items-center gap-2.5 py-0.5">
              <span className="w-3 text-right text-xs font-medium text-zinc-500 tabular-nums">
                {note}
              </span>
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100"
                role="img"
                aria-label={`${total} avis à ${note} sur 5`}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${largeur}%`, background: '#ECB22E' }}
                />
              </div>
              <span className="w-6 text-right text-xs text-zinc-400 tabular-nums">{total}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
