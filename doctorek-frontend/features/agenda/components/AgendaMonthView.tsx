'use client'

import { clsx } from 'clsx'
import type { Disponibilite } from '@/lib/types'

const JS_DAY_TO_KEY = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// Returns an array of Date cells for the calendar grid (Mon-start)
// Includes leading/trailing days from adjacent months to fill 6 rows
function getMonthGrid(year: number, month: number): Array<{ date: Date; inMonth: boolean }> {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)

  // Monday-based: JS getDay() 0=Sun → map to Mon-based index
  const firstWeekday = first.getDay() === 0 ? 6 : first.getDay() - 1
  const lastWeekday = last.getDay() === 0 ? 6 : last.getDay() - 1

  const cells: Array<{ date: Date; inMonth: boolean }> = []

  // Leading days from previous month
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    cells.push({ date: d, inMonth: false })
  }

  // Days of the month
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true })
  }

  // Trailing days to complete the last row
  const trailing = 6 - lastWeekday
  for (let i = 1; i <= trailing; i++) {
    cells.push({ date: new Date(year, month + 1, i), inMonth: false })
  }

  return cells
}

interface AgendaMonthViewProps {
  year: number
  month: number // 0-indexed
  disponibilites: Disponibilite[]
  selectedDay: string | null
  onSelectDay: (key: string) => void
}

export function AgendaMonthView({
  year,
  month,
  disponibilites,
  selectedDay,
  onSelectDay,
}: AgendaMonthViewProps) {
  const configuredKeys = new Set(disponibilites.map((d) => d.jourSemaine))
  const cells = getMonthGrid(year, month)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-zinc-100">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {h}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map(({ date, inMonth }, idx) => {
          const key = JS_DAY_TO_KEY[date.getDay()]
          const isToday = date.getTime() === today.getTime()
          const isConfigured = configuredKeys.has(key)
          const isSelected = selectedDay === key
          const isPast = date < today

          return (
            <button
              key={idx}
              onClick={() => inMonth && onSelectDay(key)}
              disabled={!inMonth}
              className={clsx(
                'relative flex flex-col items-center gap-1 py-3 border-t border-zinc-50 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-inset',
                !inMonth && 'cursor-default',
                inMonth && !isSelected && 'hover:bg-zinc-50',
                isSelected && 'bg-zinc-900',
              )}
            >
              <span
                className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  !inMonth && 'text-zinc-300',
                  inMonth && isPast && !isToday && !isSelected && 'text-zinc-400',
                  inMonth && !isPast && !isToday && !isSelected && 'text-zinc-700',
                  isToday && !isSelected && 'bg-blue-100 text-blue-700 font-semibold',
                  isSelected && 'bg-white/20 text-white font-semibold',
                )}
              >
                {date.getDate()}
              </span>
              {inMonth && isConfigured && (
                <span
                  className={clsx(
                    'h-1.5 w-1.5 rounded-full',
                    isSelected ? 'bg-white/60' : 'bg-emerald-500',
                  )}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
