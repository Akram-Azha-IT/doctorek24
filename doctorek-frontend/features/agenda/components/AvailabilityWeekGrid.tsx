'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Disponibilite, RendezVous } from '@/lib/types'
import { toLocalISODate } from '@/lib/date'

export const DAYS = [
  { key: 'MONDAY',    short: 'LUN', long: 'Lundi' },
  { key: 'TUESDAY',   short: 'MAR', long: 'Mardi' },
  { key: 'WEDNESDAY', short: 'MER', long: 'Mercredi' },
  { key: 'THURSDAY',  short: 'JEU', long: 'Jeudi' },
  { key: 'FRIDAY',    short: 'VEN', long: 'Vendredi' },
  { key: 'SATURDAY',  short: 'SAM', long: 'Samedi' },
  { key: 'SUNDAY',    short: 'DIM', long: 'Dimanche' },
]

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
]

const DAYS_FR = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']

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

function getMondayOfWeek(offset: number): Date {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getMondayForDate(date: Date): Date {
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function isDispoActiveOnDate(dispo: Disponibilite, date: Date): boolean {
  const start = new Date(dispo.dateDebut)
  start.setHours(0, 0, 0, 0)
  if (date < start) return false

  if (dispo.typeFinRecurrence === 'DATE' && dispo.dateFin) {
    const end = new Date(dispo.dateFin)
    end.setHours(0, 0, 0, 0)
    if (date > end) return false
  }

  if (dispo.frequence === 'UNE_SEULE_FOIS') {
    const startMonday = getMondayForDate(start)
    const dateMonday = getMondayForDate(date)
    return startMonday.getTime() === dateMonday.getTime()
  }

  if (dispo.frequence === 'PERSONNALISE') {
    const startMonday = getMondayForDate(start)
    const dateMonday = getMondayForDate(date)
    const diffWeeks = Math.round(
      (dateMonday.getTime() - startMonday.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )
    return diffWeeks % (dispo.intervalSemaines || 1) === 0
  }

  return true
}

function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function getGmtLabel(): string {
  const offset = -new Date().getTimezoneOffset() / 60
  return offset >= 0 ? `GMT+${offset}` : `GMT${offset}`
}

function getMonthYear(weekDates: Date[]): string {
  const first = weekDates[0]
  const last = weekDates[6]
  if (first.getMonth() === last.getMonth()) {
    return `${MONTHS_FR[first.getMonth()]} ${first.getFullYear()}`
  }
  const m1 = MONTHS_FR[first.getMonth()].slice(0, 3) + '.'
  const m2 = MONTHS_FR[last.getMonth()].slice(0, 3) + '.'
  return `${m1} – ${m2} ${last.getFullYear()}`
}

function nameToHue(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

interface HoveredRdv {
  rdv: RendezVous
  rdvEnd: string
  date: Date
  x: number
  y: number
}

interface AvailabilityWeekGridProps {
  disponibilites: Disponibilite[]
  rendezVous: RendezVous[]
  selectedDay: string | null
  onSelectDay: (day: string) => void
}

export function AvailabilityWeekGrid({
  disponibilites,
  rendezVous,
  selectedDay,
  onSelectDay,
}: AvailabilityWeekGridProps) {
  const router = useRouter()
  const [weekOffset, setWeekOffset] = useState(0)
  const [hovered, setHovered] = useState<HoveredRdv | null>(null)

  /** Ouvre la fiche du patient depuis un RDV de l'agenda (même cible que la liste patients). */
  function openPatient(rdv: RendezVous) {
    if (!rdv.patientId) return
    const params = new URLSearchParams({
      prenom: rdv.patientPrenom ?? '',
      nom: rdv.patientNom ?? '',
    })
    router.push(`/dashboard/medecin/patients/${rdv.patientId}?${params}`)
  }

  const monday = getMondayOfWeek(weekOffset)
  const weekDates = getWeekDates(monday)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthYear = getMonthYear(weekDates)
  const gmtLabel = getGmtLabel()

  const byDay = new Map<string, Disponibilite[]>()
  disponibilites.forEach((d) => {
    const arr = byDay.get(d.jourSemaine) ?? []
    arr.push(d)
    byDay.set(d.jourSemaine, arr)
  })

  const gridHeight = (GRID_END - GRID_START) * HOUR_HEIGHT

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* ── Top nav bar ─────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 shrink-0">
        <button
          type="button"
          onClick={() => setWeekOffset(0)}
          className="rounded-full border border-gray-300 px-3.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Aujourd&apos;hui
        </button>

        <button
          type="button"
          onClick={() => setWeekOffset((o) => o - 1)}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Semaine précédente"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setWeekOffset((o) => o + 1)}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Semaine suivante"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <span className="ml-1 text-sm font-semibold text-gray-800">{monthYear}</span>
      </div>

      {/* ── Day header row with date numbers ────── */}
      <div className="flex border-b border-gray-200 shrink-0">
        {/* GMT gutter */}
        <div className="w-14 shrink-0 flex items-end justify-end pr-2 pb-1.5">
          <span className="text-[9px] font-medium text-gray-400">{gmtLabel}</span>
        </div>

        {DAYS.map((day, i) => {
          const date = weekDates[i]
          const isToday = isSameDay(date, today)
          const selected = selectedDay === day.key
          const configured = (byDay.get(day.key) ?? []).filter(d => isDispoActiveOnDate(d, date)).length > 0

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onSelectDay(day.key)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 border-l border-gray-100 transition-colors ${
                selected && !isToday ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <span
                className={`text-[10px] font-bold tracking-widest uppercase ${
                  isToday ? 'text-blue-600' : selected ? 'text-blue-500' : 'text-gray-400'
                }`}
              >
                {day.short}.
              </span>
              <span
                className={`h-7 w-7 flex items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isToday
                    ? 'bg-blue-600 text-white'
                    : configured && selected
                      ? 'bg-blue-500 text-white'
                      : configured
                        ? 'text-blue-600'
                        : selected
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-700'
                }`}
              >
                {date.getDate()}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Scrollable grid body ─────────────────── */}
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
          {DAYS.map((day, i) => {
            const slots = (byDay.get(day.key) ?? []).filter(d => isDispoActiveOnDate(d, weekDates[i]))
            const selected = selectedDay === day.key
            const dateISO = toLocalISODate(weekDates[i])
            const dayRdvs = rendezVous.filter(
              (r) => r.dateRdv === dateISO && r.statut !== 'ANNULE',
            )

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

                {/* Availability blocks */}
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
                      {Array.from({ length: numSlots }).map((_, si) => (
                        <div
                          key={si}
                          className={`absolute left-0.5 right-0.5 rounded-sm ${
                            selected
                              ? 'bg-blue-200 border border-blue-300'
                              : 'bg-blue-100 border border-blue-200'
                          }`}
                          style={{ top: si * slotPx + 1, height: slotPx - 2 }}
                        />
                      ))}

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

                {/* RDV blocks */}
                {dayRdvs.map((rdv) => {
                  const rdvEnd = (() => {
                    const [h, m] = rdv.heureRdv.split(':').map(Number)
                    const total = h * 60 + (m ?? 0) + rdv.duree
                    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
                  })()
                  const top = calcTop(rdv.heureRdv)
                  const height = Math.max(calcHeight(rdv.heureRdv, rdvEnd), 20)
                  const isTermine = rdv.statut === 'TERMINE'
                  const patientLabel = rdv.patientPrenom && rdv.patientNom
                    ? `${rdv.patientPrenom} ${rdv.patientNom}`
                    : null

                  return (
                    <button
                      key={rdv.id}
                      type="button"
                      className={`absolute left-1 right-1 rounded z-20 px-1 py-0.5 overflow-hidden border cursor-pointer text-left ${
                        isTermine
                          ? 'bg-gray-100 border-gray-300'
                          : 'bg-indigo-500 border-indigo-600'
                      }`}
                      style={{ top, height }}
                      onMouseEnter={(e) => {
                        e.stopPropagation()
                        setHovered({ rdv, rdvEnd, date: weekDates[i], x: e.clientX, y: e.clientY })
                      }}
                      onMouseLeave={() => setHovered(null)}
                      onClick={(e) => {
                        e.stopPropagation()
                        openPatient(rdv)
                      }}
                      aria-label={`Ouvrir la fiche de ${patientLabel ?? 'ce patient'}`}
                    >
                      <p className={`text-[9px] font-bold leading-tight truncate ${isTermine ? 'text-gray-500' : 'text-white'}`}>
                        {rdv.heureRdv}
                      </p>
                      {patientLabel && height > 24 && (
                        <p className={`text-[9px] leading-tight truncate ${isTermine ? 'text-gray-400' : 'text-indigo-100'}`}>
                          {patientLabel}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RDV hover popover ────────────────────── */}
      {hovered && (() => {
        // Clamp dans le viewport : flip à gauche près du bord droit, borne haut/bas.
        const W = 224 // w-56
        // Hauteur estimée : le bloc motif (3 lignes max) et la mention de clic s'ajoutent.
        const H = hovered.rdv.motif?.trim() ? 250 : 190
        const M = 8   // marge écran
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800
        let left = hovered.x + 14
        if (left + W > vw - M) left = hovered.x - 14 - W
        if (left < M) left = M
        let top = hovered.y - 8
        if (top + H > vh - M) top = vh - M - H
        if (top < M) top = M
        return (
        <div
          className="fixed z-50 w-56 rounded-xl bg-white shadow-xl border border-gray-100 p-3 pointer-events-none"
          style={{ left, top }}
        >
          <p className="text-xs font-bold text-gray-800 mb-2 truncate">
            Patient : {hovered.rdv.patientPrenom} {hovered.rdv.patientNom}
          </p>

          {hovered.rdv.patientPrenom && (
            <div className="flex items-center gap-2 mb-2.5">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{
                  backgroundColor: `hsl(${nameToHue(`${hovered.rdv.patientPrenom}${hovered.rdv.patientNom ?? ''}`)}, 55%, 52%)`,
                }}
              >
                {hovered.rdv.patientPrenom.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-gray-700 truncate">
                {hovered.rdv.patientPrenom} {hovered.rdv.patientNom}
              </span>
            </div>
          )}

          <div className="flex items-start gap-1.5 text-[11px] text-gray-500 leading-snug">
            <svg className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>
              {DAYS_FR[hovered.date.getDay()]}, {hovered.date.getDate()} {MONTHS_FR[hovered.date.getMonth()]}
              <br />
              De {hovered.rdv.heureRdv} à {hovered.rdvEnd}
            </span>
          </div>

          {/* Réservé par un tiers : le médecin doit savoir qu'il ne parlera pas
              nécessairement à la personne qui a pris le rendez-vous. */}
          {hovered.rdv.creeParNom ? (
            <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-[#FFF8E6] px-2 py-1.5 text-[11px] leading-snug text-[#8A6100]">
              <svg className="h-3.5 w-3.5 shrink-0 mt-px" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72M18 18.72V14.25a5.98 5.98 0 0 0-.75-2.906M18 18.72a23.85 23.85 0 0 1-12 0M6.75 15.75a3 3 0 0 0-4.682 2.72 9.094 9.094 0 0 0 3.741.479M12 12.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
              <span>
                Réservé par <span className="font-semibold">{hovered.rdv.creeParNom}</span> pour ce patient
              </span>
            </div>
          ) : hovered.rdv.patientPrenom && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1.5">
              <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span>Réservé par le patient</span>
            </div>
          )}

          {/* Motif saisi par le patient : c'est l'information que le médecin lit en priorité
              avant la consultation, elle doit être visible sans ouvrir la fiche. */}
          {hovered.rdv.motif?.trim() && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-start gap-1.5 text-[11px] leading-snug text-gray-600">
                <svg className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#007DFF]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5h8M8 14h5m-4.5 6L3 21V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9.5Z" />
                </svg>
                <span className="line-clamp-3">
                  <span className="font-semibold text-gray-700">Motif : </span>
                  {hovered.rdv.motif}
                </span>
              </div>
            </div>
          )}

          <p className="mt-2 text-[10px] font-medium text-[#007DFF]">Cliquer pour ouvrir la fiche</p>
        </div>
        )
      })()}
    </div>
  )
}
