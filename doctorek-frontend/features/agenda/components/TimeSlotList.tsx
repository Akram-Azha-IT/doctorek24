'use client'

import { clsx } from 'clsx'
import type { Creneau } from '@/lib/types'

interface TimeSlotListProps {
  creneaux: Creneau[]
  selected: string | null
  onSelect: (c: Creneau) => void
  isLoading: boolean
  isError: boolean
  dateLabel: string
}

export function TimeSlotList({
  creneaux,
  selected,
  onSelect,
  isLoading,
  isError,
  dateLabel,
}: TimeSlotListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-5 w-32 bg-zinc-100 animate-pulse rounded mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-11 bg-zinc-100 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-sm text-red-500 py-4">
        Impossible de charger les créneaux. Vérifiez que le médecin a configuré son agenda.
      </p>
    )
  }

  const available = creneaux.filter((c) => c.disponible)

  return (
    <div>
      <p className="text-sm font-semibold text-zinc-900 mb-3 capitalize">{dateLabel}</p>

      {available.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
            <svg
              className="w-5 h-5 text-zinc-400"
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
          <p className="text-sm font-medium text-zinc-700">Aucun créneau disponible</p>
          <p className="text-xs text-zinc-400 mt-1">Essayez une autre date</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {available.map((c) => (
            <li key={c.debut}>
              <button
                onClick={() => onSelect(c)}
                className={clsx(
                  'w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1',
                  selected === c.debut
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-50 text-zinc-800 hover:bg-zinc-100',
                )}
              >
                <span>{c.debut}</span>
                {selected === c.debut && (
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
