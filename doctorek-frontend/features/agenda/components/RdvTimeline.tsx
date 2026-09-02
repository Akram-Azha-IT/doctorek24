'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import type { RendezVous } from '@/lib/types'
import { useRdvsNotables } from '@/features/avis/hooks'
import { statutAffiche } from '../rdv-timeline'
import { RdvTimelineItem } from './RdvTimelineItem'

interface RdvTimelineProps {
  readonly rdvs: readonly RendezVous[]
  readonly isReprogramming: boolean
  readonly onReprogrammer: (id: string, date: string, heure: string) => void
  readonly isCancelling?: boolean
  readonly onAnnuler?: (id: string) => void
}

function compareDateTimeAsc(a: RendezVous, b: RendezVous): number {
  return `${a.dateRdv}T${a.heureRdv}`.localeCompare(`${b.dateRdv}T${b.heureRdv}`)
}

function formatToday(): string {
  const date = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
  return date.charAt(0).toUpperCase() + date.slice(1)
}

export function RdvTimeline({
  rdvs,
  isReprogramming,
  onReprogrammer,
  isCancelling,
  onAnnuler,
}: RdvTimelineProps) {
  const activeRdvs = useMemo(
    () => rdvs
      .filter((rdv) => {
        const statut = statutAffiche(rdv)
        return statut === 'EN_ATTENTE' || statut === 'CONFIRME'
      })
      .sort(compareDateTimeAsc),
    [rdvs],
  )

  const historyRdvs = useMemo(
    () => rdvs
      .filter((rdv) => {
        const statut = statutAffiche(rdv)
        return statut === 'ANNULE' || statut === 'TERMINE'
      })
      .sort((a, b) => -compareDateTimeAsc(a, b)),
    [rdvs],
  )

  const idsTermines = useMemo(
    () => historyRdvs.filter((rdv) => statutAffiche(rdv) === 'TERMINE').map((rdv) => rdv.id),
    [historyRdvs],
  )
  const { data: notables } = useRdvsNotables(idsTermines)
  const notablesSet = useMemo(() => new Set(notables ?? []), [notables])

  const [featuredRdv, ...remainingActive] = activeRdvs
  const itemProps = { isReprogramming, onReprogrammer, isCancelling, onAnnuler }

  return (
    <div className="space-y-5">
      <div className="flex max-w-xl items-center gap-3 text-sm text-[#243652]">
        <p className="shrink-0 font-semibold">
          Aujourd&apos;hui <span className="px-1.5 text-[#9AA8BA]">-</span> {formatToday()}
        </p>
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#007DFF]" aria-hidden="true" />
        <span className="h-px min-w-10 flex-1 border-t border-dotted border-[#78B8FF]" aria-hidden="true" />
      </div>

      {featuredRdv ? (
        <ol>
          <RdvTimelineItem rdv={featuredRdv} variant="featured" {...itemProps} />
        </ol>
      ) : (
        <EmptyUpcoming />
      )}

      {remainingActive.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-[#D7E0EC] bg-white shadow-[0_5px_18px_rgba(1,38,60,0.04)]">
          <div className="border-b border-[#E5EAF1] px-5 py-3">
            <h2 className="font-heading text-lg font-bold text-[#010C2D]">Autres rendez-vous à venir</h2>
          </div>
          <ol className="divide-y divide-[#E5EAF1]">
            {remainingActive.map((rdv) => (
              <RdvTimelineItem key={rdv.id} rdv={rdv} variant="upcoming" {...itemProps} />
            ))}
          </ol>
        </section>
      )}

      {historyRdvs.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-[#D7E0EC] bg-white shadow-[0_5px_18px_rgba(1,38,60,0.04)]">
          <div className="border-b border-[#E5EAF1] px-5 py-3">
            <h2 className="font-heading text-lg font-bold text-[#010C2D]">Historique</h2>
          </div>
          <ol className="divide-y divide-[#E5EAF1]">
            {historyRdvs.map((rdv) => (
              <RdvTimelineItem
                key={rdv.id}
                rdv={rdv}
                variant="history"
                peutNoter={notablesSet.has(rdv.id)}
                {...itemProps}
              />
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

function EmptyUpcoming() {
  return (
    <section className="rounded-2xl border border-[#D7E0EC] bg-white px-5 py-8 shadow-[0_5px_18px_rgba(1,38,60,0.04)] sm:px-6">
      <h2 className="font-heading text-xl font-bold text-[#010C2D]">Prochain rendez-vous</h2>
      <div className="mt-5 flex flex-col items-start gap-4 rounded-xl border border-dashed border-[#C7D7EA] bg-[#F8FBFF] p-5 sm:flex-row sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#007DFF]">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-[#10213F]">Aucun rendez-vous à venir</p>
          <p className="mt-1 text-sm leading-6 text-[#64748B]">Trouvez un médecin et choisissez un horaire adapté.</p>
        </div>
        <Link
          href="/recherche"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#007DFF] px-5 text-sm font-bold text-white transition-colors hover:bg-[#0069D7]"
        >
          Trouver un médecin
        </Link>
      </div>
    </section>
  )
}
