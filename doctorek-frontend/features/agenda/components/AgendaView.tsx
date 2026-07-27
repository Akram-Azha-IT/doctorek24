'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import type { Disponibilite } from '@/lib/types'
import { AgendaWeekView, getWeekDates } from './AgendaWeekView'
import { AgendaMonthView } from './AgendaMonthView'
import { AgendaYearView } from './AgendaYearView'

type ViewMode = 'week' | 'month' | 'year'

const VIEW_LABELS: Record<ViewMode, string> = {
  week: 'Semaine',
  month: 'Mois',
  year: 'Année',
}

const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

interface AgendaViewProps {
  disponibilites: Disponibilite[]
  selectedDay: string | null
  onSelectDay: (key: string) => void
}

export function AgendaView({ disponibilites, selectedDay, onSelectDay }: AgendaViewProps) {
  const [view, setView] = useState<ViewMode>('week')
  const [ref, setRef] = useState<Date>(new Date())

  const today = new Date()

  function goToday() {
    setRef(new Date())
  }

  function navigate(dir: -1 | 1) {
    setRef((prev) => {
      const d = new Date(prev)
      if (view === 'week') {
        d.setDate(d.getDate() + dir * 7)
      } else if (view === 'month') {
        d.setMonth(d.getMonth() + dir)
      } else {
        d.setFullYear(d.getFullYear() + dir)
      }
      return d
    })
  }

  // Period label
  const weekDates = getWeekDates(ref)
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]

  function periodLabel() {
    if (view === 'week') {
      const startFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(weekStart)
      const endFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(weekEnd)
      return `${startFmt} – ${endFmt}`
    }
    if (view === 'month') {
      return `${MONTH_LABELS[ref.getMonth()]} ${ref.getFullYear()}`
    }
    return `${ref.getFullYear()}`
  }

  const isCurrentPeriod = (() => {
    if (view === 'week') {
      return weekDates.some((d) => {
        const copy = new Date(d); copy.setHours(0,0,0,0)
        const t = new Date(today); t.setHours(0,0,0,0)
        return copy.getTime() === t.getTime()
      })
    }
    if (view === 'month') {
      return ref.getMonth() === today.getMonth() && ref.getFullYear() === today.getFullYear()
    }
    return ref.getFullYear() === today.getFullYear()
  })()

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
          {(Object.keys(VIEW_LABELS) as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
                view === v
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50',
              )}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 sm:ml-auto">
          {!isCurrentPeriod && (
            <button
              onClick={goToday}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 hover:text-zinc-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              Aujourd&apos;hui
            </button>
          )}

          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => navigate(-1)}
              aria-label="Période précédente"
              className="px-3 py-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            <span className="min-w-[160px] text-center text-sm font-semibold text-zinc-900 px-1">
              {periodLabel()}
            </span>

            <button
              onClick={() => navigate(1)}
              aria-label="Période suivante"
              className="px-3 py-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-emerald-100 border border-emerald-200" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-zinc-900" />
          Sélectionné
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-blue-100 border border-blue-200" />
          Aujourd&apos;hui
        </span>
      </div>

      {/* View content */}
      {view === 'week' && (
        <AgendaWeekView
          weekDates={weekDates}
          disponibilites={disponibilites}
          selectedDay={selectedDay}
          onSelectDay={onSelectDay}
        />
      )}

      {view === 'month' && (
        <AgendaMonthView
          year={ref.getFullYear()}
          month={ref.getMonth()}
          disponibilites={disponibilites}
          selectedDay={selectedDay}
          onSelectDay={onSelectDay}
        />
      )}

      {view === 'year' && (
        <AgendaYearView
          year={ref.getFullYear()}
          disponibilites={disponibilites}
          selectedDay={selectedDay}
          onSelectDay={onSelectDay}
        />
      )}
    </div>
  )
}
