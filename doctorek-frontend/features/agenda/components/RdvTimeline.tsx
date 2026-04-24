'use client'

import type { RendezVous } from '@/lib/types'
import { groupRdvsBySection } from '@/lib/rdv-timeline'
import { RdvTimelineItem } from './RdvTimelineItem'

interface RdvTimelineProps {
  rdvs: readonly RendezVous[]
  isReprogramming: boolean
  onReprogrammer: (id: string, date: string, heure: string) => void
}

interface TimelineSectionProps {
  title: string
  rdvs: readonly RendezVous[]
  isReprogramming: boolean
  onReprogrammer: (id: string, date: string, heure: string) => void
}

function TimelineSection({
  title,
  rdvs,
  isReprogramming,
  onReprogrammer,
}: TimelineSectionProps) {
  if (rdvs.length === 0) return null

  return (
    <section className="mb-8 last:mb-0">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </h2>
      <ol className="relative space-y-3">
        {rdvs.map((rdv, index) => (
          <RdvTimelineItem
            key={rdv.id}
            rdv={rdv}
            isLast={index === rdvs.length - 1}
            isReprogramming={isReprogramming}
            onReprogrammer={onReprogrammer}
          />
        ))}
      </ol>
    </section>
  )
}

export function RdvTimeline({
  rdvs,
  isReprogramming,
  onReprogrammer,
}: RdvTimelineProps) {
  const { upcoming, today, past } = groupRdvsBySection(rdvs)

  if (upcoming.length === 0 && today.length === 0 && past.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
        <p className="text-sm text-zinc-400">Aucun rendez-vous trouvé</p>
      </div>
    )
  }

  const sectionProps = { isReprogramming, onReprogrammer }

  return (
    <div>
      <TimelineSection title="Aujourd'hui" rdvs={today} {...sectionProps} />
      <TimelineSection title="À venir" rdvs={upcoming} {...sectionProps} />
      <TimelineSection title="Passés" rdvs={past} {...sectionProps} />
    </div>
  )
}
