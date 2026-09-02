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
        <p className="text-[12px] font-medium capitalize text-[#52678D]">{dateLabel}</p>
        <h1 className="font-heading mt-1 text-[25px] font-extrabold leading-tight tracking-[-0.035em] text-[#071A47] md:text-[30px]">
          Bonjour{firstName ? `, Dr ${firstName}` : ''}
        </h1>
        <p className="mt-1.5 text-sm text-[#52678D]">
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
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(8,124,250,0.16)] transition-colors hover:bg-[#006DE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087CFA]/40 focus-visible:ring-offset-2"
      >
        <CalendarDays className="h-4 w-4" />
        Voir l&apos;agenda
      </button>
    </div>
  )
}
