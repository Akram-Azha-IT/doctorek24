'use client'

import type { Disponibilite } from '@/lib/types'

const DAYS = [
  { key: 'MONDAY', short: 'LUN', long: 'Lundi' },
  { key: 'TUESDAY', short: 'MAR', long: 'Mardi' },
  { key: 'WEDNESDAY', short: 'MER', long: 'Mercredi' },
  { key: 'THURSDAY', short: 'JEU', long: 'Jeudi' },
  { key: 'FRIDAY', short: 'VEN', long: 'Vendredi' },
  { key: 'SATURDAY', short: 'SAM', long: 'Samedi' },
  { key: 'SUNDAY', short: 'DIM', long: 'Dimanche' },
]

const GRID_START = 7
const GRID_END = 21
const HOUR_HEIGHT = 60

const hours = Array.from({ length: GRID_END - GRID_START + 1 }, (_, i) => i + GRID_START)

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

function calcTop(time: string): number {
  return ((timeToMinutes(time) - GRID_START * 60) / 60) * HOUR_HEIGHT
}

function calcHeight(start: string, end: string): number {
  return ((timeToMinutes(end) - timeToMinutes(start)) / 60) * HOUR_HEIGHT
}

interface AvailabilityWeekGridProps {
  disponibilites: Disponibilite[]
  selectedDay: string | null
  onSelectDay: (day: string) => void
}

export function AvailabilityWeekGrid({
  disponibilites,
  selectedDay,
  onSelectDay,
}: AvailabilityWeekGridProps) {
  // Group by day — now supports multiple per day
  const byDay = new Map<string, Disponibilite[]>()
  disponibilites.forEach((d) => {
    const arr = byDay.get(d.jourSemaine) ?? []
    arr.push(d)
    byDay.set(d.jourSemaine, arr)
  })

  const gridHeight = (GRID_END - GRID_START) * HOUR_HEIGHT

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Day header row */}
      <div className="flex border-b border-gray-200 shrink-0">
        <div className="w-14 shrink-0" />
        {DAYS.map((day) => {
          const slots = byDay.get(day.key) ?? []
          const configured = slots.length > 0
          const selected = selectedDay === day.key
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onSelectDay(day.key)}
              className={`flex-1 flex flex-col items-center py-3 gap-1.5 border-l border-gray-100 transition-colors ${
                selected ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <span
                className={`text-[10px] font-bold tracking-widest uppercase ${
                  selected ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {day.short}
              </span>
              <span
                className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  configured && selected
                    ? 'bg-blue-600 text-white'
                    : configured
                      ? 'bg-blue-500 text-white'
                      : selected
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-300'
                }`}
              >
                {configured ? (
                  <span className="text-[10px] font-bold">{slots.length}</span>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* Scrollable grid body */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridHeight }}>
          {/* Time labels */}
          <div className="w-14 shrink-0 relative">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-0 w-full"
                style={{ top: (h - GRID_START) * HOUR_HEIGHT - 9 }}
              >
                {h < GRID_END && (
                  <span className="block text-right pr-2.5 text-[10px] font-medium text-gray-400">
                    {String(h).padStart(2, '0')}:00
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((day) => {
            const slots = byDay.get(day.key) ?? []
            const selected = selectedDay === day.key

            return (
              <div
                key={day.key}
                className={`flex-1 border-l border-gray-100 relative cursor-pointer transition-colors ${
                  selected ? 'bg-blue-50/30' : ''
                }`}
                style={{ height: gridHeight }}
                onClick={() => onSelectDay(day.key)}
              >
                {/* Hour lines */}
                {hours.map((h) =>
                  h < GRID_END ? (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-gray-100"
                      style={{ top: (h - GRID_START) * HOUR_HEIGHT }}
                    />
                  ) : null,
                )}

                {/* Half-hour lines */}
                {hours.map((h) =>
                  h < GRID_END ? (
                    <div
                      key={`${h}-30`}
                      className="absolute left-0 right-0 border-t border-gray-50"
                      style={{ top: (h - GRID_START) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                    />
                  ) : null,
                )}

                {/* Multiple availability blocks */}
                {slots.map((slot) => {
                  const top = calcTop(slot.heureDebut)
                  const height = calcHeight(slot.heureDebut, slot.heureFin)
                  const slotPx = (slot.dureeConsultation / 60) * HOUR_HEIGHT
                  const totalMin = timeToMinutes(slot.heureFin) - timeToMinutes(slot.heureDebut)
                  const numSlots = Math.max(Math.floor(totalMin / slot.dureeConsultation), 1)

                  return (
                    <div
                      key={slot.id}
                      className={`absolute left-0.5 right-0.5 rounded-md overflow-hidden ${
                        selected ? 'bg-blue-100' : 'bg-blue-50'
                      }`}
                      style={{ top, height }}
                    >
                      {/* Individual consultation slot indicators */}
                      {Array.from({ length: numSlots }).map((_, i) => (
                        <div
                          key={i}
                          className={`absolute left-0.5 right-0.5 rounded-sm ${
                            selected
                              ? 'bg-blue-200 border border-blue-300'
                              : 'bg-blue-100 border border-blue-200'
                          }`}
                          style={{ top: i * slotPx + 1, height: slotPx - 2 }}
                        />
                      ))}

                      {/* Time label overlay */}
                      <div className="absolute top-1 left-1.5 z-10">
                        <p className="text-[10px] font-bold text-blue-700 leading-tight">
                          {slot.heureDebut}
                        </p>
                      </div>
                      <div className="absolute bottom-1 left-1.5 z-10">
                        <p className="text-[10px] font-medium text-blue-600 leading-tight">
                          {slot.heureFin}
                        </p>
                      </div>
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

export { DAYS }
