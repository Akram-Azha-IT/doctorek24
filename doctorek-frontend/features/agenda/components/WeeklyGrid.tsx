'use client'

import type { Disponibilite } from '@/lib/types'

const DAYS: { key: string; label: string; short: string }[] = [
  { key: 'MONDAY',    label: 'Lundi',    short: 'Lun' },
  { key: 'TUESDAY',   label: 'Mardi',    short: 'Mar' },
  { key: 'WEDNESDAY', label: 'Mercredi', short: 'Mer' },
  { key: 'THURSDAY',  label: 'Jeudi',    short: 'Jeu' },
  { key: 'FRIDAY',    label: 'Vendredi', short: 'Ven' },
  { key: 'SATURDAY',  label: 'Samedi',   short: 'Sam' },
  { key: 'SUNDAY',    label: 'Dimanche', short: 'Dim' },
]

interface WeeklyGridProps {
  disponibilites: Disponibilite[]
  selectedDay: string | null
  onSelectDay: (day: string) => void
}

export function WeeklyGrid({ disponibilites, selectedDay, onSelectDay }: WeeklyGridProps) {
  const byDay = new Map<string, Disponibilite[]>()
  disponibilites.forEach((d) => {
    const arr = byDay.get(d.jourSemaine) ?? []
    arr.push(d)
    byDay.set(d.jourSemaine, arr)
  })

  return (
    <div className="grid grid-cols-7 gap-2">
      {DAYS.map(({ key, label, short }) => {
        const dispos = byDay.get(key) ?? []
        const isSelected = selectedDay === key
        const isConfigured = dispos.length > 0

        return (
          <button
            key={key}
            onClick={() => onSelectDay(key)}
            title={label}
            className={[
              'flex flex-col items-center rounded-xl border px-1 py-3 text-center transition-all',
              'min-h-[120px] w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
              isSelected
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                : isConfigured
                  ? 'border-emerald-200 bg-emerald-50 text-zinc-800 hover:border-emerald-400'
                  : 'border-zinc-200 bg-white text-zinc-400 hover:border-zinc-400 hover:text-zinc-600',
            ].join(' ')}
          >
            <span
              className={[
                'text-xs font-semibold uppercase tracking-wider',
                isSelected ? 'text-zinc-300' : 'text-zinc-400',
              ].join(' ')}
            >
              {short}
            </span>

            {isConfigured ? (
              <div className="mt-2 flex flex-col items-center gap-1 w-full">
                {dispos.map((d, i) => (
                  <div key={d.id} className="flex flex-col items-center">
                    {dispos.length > 1 && (
                      <span
                        className={`text-[10px] font-medium uppercase tracking-wide ${
                          isSelected ? 'text-zinc-400' : 'text-zinc-400'
                        }`}
                      >
                        {i === 0 ? 'Mat.' : 'A.M.'}
                      </span>
                    )}
                    <span
                      className={`text-xs font-semibold leading-tight ${
                        isSelected ? 'text-white' : 'text-zinc-900'
                      }`}
                    >
                      {d.heureDebut}
                    </span>
                    <span
                      className={`text-[11px] leading-tight ${
                        isSelected ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      {d.heureFin}
                    </span>
                  </div>
                ))}
                <span
                  className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {dispos[0].dureeConsultation} min
                </span>
              </div>
            ) : (
              <div className="mt-3 flex flex-col items-center gap-1">
                <span className="text-xl leading-none">+</span>
                <span className="text-[11px]">Ajouter</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

export { DAYS }
