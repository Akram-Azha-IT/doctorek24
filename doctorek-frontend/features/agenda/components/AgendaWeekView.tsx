'use client'

import { clsx } from 'clsx'
import type { Disponibilite } from '@/lib/types'

const START_HOUR = 8
const END_HOUR = 19
const HOUR_PX = 52 // px per hour

const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => `${String(START_HOUR + i).padStart(2, '0')}:00`,
)

const JS_DAY_TO_KEY = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

function timeOffsetPx(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h * 60 + m) - START_HOUR * 60) * (HOUR_PX / 60)
}

function durationPx(debut: string, fin: string): number {
  const [h1, m1] = debut.split(':').map(Number)
  const [h2, m2] = fin.split(':').map(Number)
  return ((h2 * 60 + m2) - (h1 * 60 + m1)) * (HOUR_PX / 60)
}

function getWeekDates(ref: Date): Date[] {
  const d = new Date(ref)
  const jsDay = d.getDay()
  const diff = jsDay === 0 ? -6 : 1 - jsDay
  d.setDate(d.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(d)
    date.setDate(d.getDate() + i)
    return date
  })
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

interface AgendaWeekViewProps {
  weekDates: Date[]
  disponibilites: Disponibilite[]
  selectedDay: string | null
  onSelectDay: (key: string) => void
}

export function AgendaWeekView({ weekDates, disponibilites, selectedDay, onSelectDay }: AgendaWeekViewProps) {
  const byKey = new Map<string, Disponibilite[]>()
  disponibilites.forEach((d) => {
    const arr = byKey.get(d.jourSemaine) ?? []
    arr.push(d)
    byKey.set(d.jourSemaine, arr)
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalHeight = (END_HOUR - START_HOUR) * HOUR_PX

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-[48px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-zinc-100">
        <div /> {/* time gutter */}
        {weekDates.map((date, i) => {
          const key = JS_DAY_TO_KEY[date.getDay()]
          const isToday = date.getTime() === today.getTime()
          const isSelected = selectedDay === key
          const isConfigured = (byKey.get(key) ?? []).length > 0

          return (
            <button
              key={key}
              onClick={() => onSelectDay(key)}
              className={clsx(
                'flex flex-col items-center gap-0.5 py-3 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-inset',
                isSelected ? 'bg-zinc-900' : 'hover:bg-zinc-50',
              )}
            >
              <span className={clsx(
                'text-[11px] font-semibold uppercase tracking-wider',
                isSelected ? 'text-zinc-300' : 'text-zinc-400',
              )}>
                {DAY_LABELS[i]}
              </span>
              <span className={clsx(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                isToday && !isSelected ? 'bg-blue-100 text-blue-700' :
                isSelected ? 'bg-white/20 text-white' :
                'text-zinc-700',
              )}>
                {date.getDate()}
              </span>
              {isConfigured && !isSelected && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto max-h-[520px]">
        <div className="grid grid-cols-[48px_1fr_1fr_1fr_1fr_1fr_1fr_1fr]">
          {/* Hour labels */}
          <div className="relative" style={{ height: totalHeight }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-2 text-[11px] text-zinc-400 -translate-y-2.5"
                style={{ top: timeOffsetPx(h) }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((date) => {
            const key = JS_DAY_TO_KEY[date.getDay()]
            const dispos = byKey.get(key) ?? []
            const isSelected = selectedDay === key

            return (
              <div
                key={key}
                className={clsx(
                  'relative border-l border-zinc-100',
                  isSelected && 'bg-zinc-50',
                )}
                style={{ height: totalHeight }}
              >
                {/* Hour grid lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-zinc-100"
                    style={{ top: timeOffsetPx(h) }}
                  />
                ))}

                {/* Disponibilité blocks */}
                {dispos.map((d) => {
                  const top = timeOffsetPx(d.heureDebut)
                  const height = Math.max(durationPx(d.heureDebut, d.heureFin), 20)

                  return (
                    <div
                      key={d.id}
                      className={clsx(
                        'absolute inset-x-0.5 rounded-md px-2 py-1 overflow-hidden',
                        isSelected
                          ? 'bg-zinc-200 border border-zinc-300'
                          : 'bg-emerald-100 border border-emerald-200 hover:bg-emerald-200 cursor-pointer',
                      )}
                      style={{ top, height }}
                      onClick={() => onSelectDay(key)}
                    >
                      <p className="text-[11px] font-semibold text-emerald-800 leading-tight truncate">
                        {d.heureDebut} – {d.heureFin}
                      </p>
                      <p className="text-[10px] text-emerald-600 leading-tight">
                        {d.dureeConsultation} min
                      </p>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { getWeekDates, JS_DAY_TO_KEY }
