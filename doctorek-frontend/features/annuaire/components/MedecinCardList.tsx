'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { MedecinAvatar } from './MedecinAvatar'
import { getCreneaux } from '@/features/agenda/api'
import type { MedecinProfile } from '@/lib/types'
import { nextNDaysISO } from '@/lib/disponibilite'

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function formatDayLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return {
    day: DAYS_FR[d.getDay()],
    date: `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`,
  }
}

interface MedecinCardListProps {
  medecin: MedecinProfile
  availableToday: boolean
  distanceKm?: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function MedecinCardList({ medecin, availableToday, distanceKm, onMouseEnter, onMouseLeave }: MedecinCardListProps) {
  const dates = nextNDaysISO(5)
  const accepte = medecin.acceptNouveauxPatients !== false

  const { data: todayCreneaux, isLoading: slotsLoading } = useQuery({
    queryKey: ['creneaux', medecin.id, dates[0]],
    queryFn: () => getCreneaux(medecin.id, dates[0]),
    enabled: availableToday,
    staleTime: 30_000,
  })

  const availableSlots = todayCreneaux?.filter((c) => c.disponible).slice(0, 3) ?? []

  return (
    <div
      className="group mb-3 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex">
        {/* Doctor info */}
        <Link
          href={`/medecins/${medecin.id}`}
          className="flex flex-1 gap-4 p-5 min-w-0"
        >
          <MedecinAvatar firstName={medecin.firstName} lastName={medecin.lastName} size="lg" />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-[#1863A9] group-hover:underline underline-offset-2">
                Dr. {medecin.firstName} {medecin.lastName}
              </h3>
              {medecin.secteurTarifaire && (
                <span className="rounded-full bg-[#DFEFFE] px-2 py-0.5 text-[11px] font-semibold text-[#1863A9]">
                  Secteur {medecin.secteurTarifaire}
                </span>
              )}
              {distanceKm !== undefined && (
                <span className="flex items-center gap-1 rounded-full bg-[#E8EFF6] px-2 py-0.5 text-[11px] font-semibold text-[#064178]">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418 0-8-4.03-8-9a8 8 0 1116 0c0 4.97-3.582 9-8 9z" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
                  </svg>
                  {distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)} m`
                    : `${distanceKm.toFixed(1)} km`}
                </span>
              )}
            </div>

            <p className="mt-0.5 text-sm font-medium text-zinc-600">{medecin.specialite}</p>

            <p className="mt-1 truncate text-xs text-zinc-400">
              {medecin.adresse}, {medecin.ville}
            </p>

            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
              {accepte ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  Accepte nouveaux patients
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
                  N&apos;accepte pas de nouveaux patients
                </span>
              )}
              {medecin.langues && medecin.langues.length > 0 && (
                <span className="text-xs text-zinc-400">
                  {medecin.langues.join(', ')}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Slot grid — 5 days */}
        <div className="flex shrink-0 border-l border-zinc-100">
          {dates.map((date, i) => {
            const { day, date: dateStr } = formatDayLabel(date)
            const isToday = i === 0

            return (
              <div
                key={date}
                className="flex w-[88px] flex-col items-center border-r border-zinc-100 px-2 py-3 last:border-r-0"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{day}</p>
                <p className="mb-2.5 text-[11px] text-zinc-400">{dateStr}</p>

                {isToday && slotsLoading ? (
                  <div className="flex flex-col gap-1.5 w-full">
                    {[0, 1, 2].map((k) => (
                      <div key={k} className="h-7 animate-pulse rounded-lg bg-zinc-100" />
                    ))}
                  </div>
                ) : isToday && availableSlots.length > 0 ? (
                  <div className="flex flex-col gap-1.5 w-full">
                    {availableSlots.map((slot) => (
                      <Link
                        key={slot.debut}
                        href={`/medecins/${medecin.id}/rdv?date=${date}&heure=${slot.debut}`}
                        className="block rounded-lg bg-[#1863A9] py-1.5 text-center text-[12px] font-semibold text-white transition-colors hover:bg-[#064178]"
                      >
                        {slot.debut}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <span className="mt-1 text-base font-light text-zinc-300">–</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
