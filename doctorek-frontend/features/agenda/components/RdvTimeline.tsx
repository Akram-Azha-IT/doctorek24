'use client'

import { useMemo } from 'react'
import type { RendezVous } from '@/lib/types'
import { useRdvsNotables } from '@/features/avis/hooks'
import { groupRdvsBySection, statutAffiche } from '../rdv-timeline'
import { RdvTimelineItem } from './RdvTimelineItem'

interface RdvTimelineProps {
  readonly rdvs: readonly RendezVous[]
  readonly isReprogramming: boolean
  readonly onReprogrammer: (id: string, date: string, heure: string) => void
  readonly isCancelling?: boolean
  readonly onAnnuler?: (id: string) => void
}

interface SectionHeaderProps {
  title: string
  count: number
  accent?: boolean
}

function SectionHeader({ title, count, accent }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${accent ? 'bg-[#007DFF]' : 'bg-zinc-300'}`}
      />
      <h2
        className={`text-[11px] font-bold uppercase tracking-[0.08em] ${
          accent ? 'text-[#007DFF]' : 'text-zinc-400'
        }`}
      >
        {title}
      </h2>
      <span
        className={`rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums ${
          accent ? 'bg-[#007DFF]/10 text-[#007DFF]' : 'bg-zinc-100 text-zinc-400'
        }`}
      >
        {count}
      </span>
      <div className="flex-1 h-px bg-zinc-200/80" />
    </div>
  )
}

interface TimeSectionProps {
  readonly title: string
  readonly rdvs: readonly RendezVous[]
  readonly isReprogramming: boolean
  readonly onReprogrammer: (id: string, date: string, heure: string) => void
  readonly isCancelling?: boolean
  readonly onAnnuler?: (id: string) => void
  readonly accent?: boolean
  readonly notables?: ReadonlySet<string>
}

function TimeSection({
  title, rdvs, isReprogramming, onReprogrammer, isCancelling, onAnnuler, accent, notables,
}: TimeSectionProps) {
  if (rdvs.length === 0) return null

  return (
    <section className="mb-7 last:mb-0">
      <SectionHeader title={title} count={rdvs.length} accent={accent} />
      <ol className="space-y-2.5">
        {rdvs.map((rdv) => (
          <RdvTimelineItem
            key={rdv.id}
            rdv={rdv}
            isReprogramming={isReprogramming}
            onReprogrammer={onReprogrammer}
            isCancelling={isCancelling}
            onAnnuler={onAnnuler}
            peutNoter={notables?.has(rdv.id) ?? false}
          />
        ))}
      </ol>
    </section>
  )
}

export function RdvTimeline({
  rdvs, isReprogramming, onReprogrammer, isCancelling, onAnnuler,
}: RdvTimelineProps) {
  const { upcoming, today, past } = groupRdvsBySection(rdvs)

  // Une seule question pour toute la liste : demander carte par carte referait
  // une requête par rendez-vous passé.
  // Les créneaux écoulés sont inclus même si le serveur n'a pas encore basculé leur
  // statut : il reste seul juge de l'éligibilité, et le bouton apparaît dès sa réponse.
  const idsTermines = useMemo(
    () => rdvs.filter((r) => statutAffiche(r) === 'TERMINE').map((r) => r.id),
    [rdvs],
  )
  const { data: notables } = useRdvsNotables(idsTermines)
  const notablesSet = useMemo(() => new Set(notables ?? []), [notables])

  if (upcoming.length === 0 && today.length === 0 && past.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-16 px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#007DFF]/10">
          <svg
            className="h-7 w-7 text-[#007DFF]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-500">Aucun rendez-vous trouvé</p>
        <p className="mt-1 text-xs text-zinc-400">
          Vos prochains rendez-vous apparaîtront ici
        </p>
      </div>
    )
  }

  const sectionProps = {
    isReprogramming, onReprogrammer, isCancelling, onAnnuler, notables: notablesSet,
  }

  return (
    <div>
      <TimeSection title="Aujourd'hui" rdvs={today} accent {...sectionProps} />
      <TimeSection title="À venir" rdvs={upcoming} accent {...sectionProps} />
      <TimeSection title="Passés" rdvs={past} {...sectionProps} />
    </div>
  )
}
