'use client'

import { CalendarDays } from 'lucide-react'

interface HeroBannerProps {
  firstName: string
  lastName: string
  todayCount: number
  dateLabel: string
  onAgenda: () => void
}

/**
 * Page header — flat and typographic, no marketing banner.
 * Hierarchy: date eyebrow, greeting, summary line; agenda CTA on the right.
 */
export function HeroBanner({ firstName, todayCount, dateLabel, onAgenda }: HeroBannerProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
      <div>
        <p className="text-[12px] font-medium capitalize text-[#6B7A99]">{dateLabel}</p>
        <h1 className="mt-1 text-[22px] md:text-[26px] font-extrabold leading-tight tracking-tight text-[#010C2D]">
          Bonjour{firstName ? `, Dr ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-[#465058]">
          {todayCount === 0
            ? "Aucun rendez-vous planifié aujourd'hui."
            : todayCount === 1
            ? "1 rendez-vous prévu aujourd'hui."
            : `${todayCount} rendez-vous prévus aujourd'hui.`}
        </p>
      </div>

      <button
        type="button"
        onClick={onAgenda}
        className="inline-flex items-center gap-2 rounded-xl bg-[#007DFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00263C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/40 focus-visible:ring-offset-2"
      >
        <CalendarDays className="h-4 w-4" />
        Voir l&apos;agenda
      </button>
    </div>
  )
}
