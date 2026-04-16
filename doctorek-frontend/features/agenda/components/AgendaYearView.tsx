'use client'

import { clsx } from 'clsx'
import type { Disponibilite } from '@/lib/types'

const JS_DAY_TO_KEY = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const DAY_MINI = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function getMiniGrid(year: number, month: number): Array<{ day: number; jsDay: number; inMonth: boolean } | null> {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const firstWeekday = first.getDay() === 0 ? 6 : first.getDay() - 1

  const cells: Array<{ day: number; jsDay: number; inMonth: boolean } | null> = []

  for (let i = 0; i < firstWeekday; i++) {
    cells.push(null)
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(year, month, d)
    cells.push({ day: d, jsDay: date.getDay(), inMonth: true })
  }

  // Pad to complete last row
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

interface AgendaYearViewProps {
  year: number
  disponibilites: Disponibilite[]
  selectedDay: string | null
  onSelectDay: (key: string) => void
}

export function AgendaYearView({ year, disponibilites, selectedDay, onSelectDay }: AgendaYearViewProps) {
  const configuredKeys = new Set(disponibilites.map((d) => d.jourSemaine))
  const today = new Date()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }, (_, monthIdx) => {
        const cells = getMiniGrid(year, monthIdx)
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthIdx

        return (
          <div
            key={monthIdx}
            className={clsx(
              'rounded-xl border bg-white p-4 shadow-sm',
              isCurrentMonth ? 'border-zinc-300' : 'border-zinc-100',
            )}
          >
            <p className={clsx(
              'text-sm font-semibold mb-3',
              isCurrentMonth ? 'text-zinc-900' : 'text-zinc-600',
            )}>
              {MONTH_LABELS[monthIdx]}
            </p>

            <div className="grid grid-cols-7 gap-px">
              {/* Day-of-week mini headers */}
              {DAY_MINI.map((d, i) => (
                <div key={i} className="text-center text-[9px] font-semibold text-zinc-300 pb-1">
                  {d}
                </div>
              ))}

              {/* Cells */}
              {cells.map((cell, idx) => {
                if (!cell) {
                  return <div key={idx} />
                }

                const key = JS_DAY_TO_KEY[cell.jsDay]
                const isConfigured = configuredKeys.has(key)
                const isSelected = selectedDay === key
                const isToday =
                  today.getDate() === cell.day &&
                  today.getMonth() === monthIdx &&
                  today.getFullYear() === year

                return (
                  <button
                    key={idx}
                    onClick={() => onSelectDay(key)}
                    className={clsx(
                      'relative flex items-center justify-center rounded text-[10px] font-medium w-full aspect-square transition-colors',
                      'focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900',
                      isSelected
                        ? 'bg-zinc-900 text-white'
                        : isConfigured
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'text-zinc-500 hover:bg-zinc-50',
                      isToday && !isSelected && 'ring-1 ring-blue-400 bg-blue-50 text-blue-700',
                    )}
                  >
                    {cell.day}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
