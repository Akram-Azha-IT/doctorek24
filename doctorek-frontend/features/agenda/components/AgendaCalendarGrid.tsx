'use client'

import { useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import type { RendezVous, Disponibilite, StatutRdv } from '@/lib/types'

// ── Constants ────────────────────────────────────────────────────────────────

const START_HOUR = 7
const END_HOUR = 21
const HOUR_PX = 60
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_PX

const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i,
)

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const JS_DAY_TO_KEY = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

const STATUT_LABELS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
}

const STATUT_COLORS: Record<StatutRdv, { bg: string; border: string; text: string; badge: string }> = {
  EN_ATTENTE: {
    bg: 'bg-amber-50',
    border: 'border-l-amber-400',
    text: 'text-amber-900',
    badge: 'bg-amber-100 text-amber-700',
  },
  CONFIRME: {
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-500',
    text: 'text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  ANNULE: {
    bg: 'bg-zinc-50 opacity-50',
    border: 'border-l-zinc-300',
    text: 'text-zinc-500',
    badge: 'bg-red-100 text-red-600',
  },
  TERMINE: {
    bg: 'bg-blue-50',
    border: 'border-l-blue-300',
    text: 'text-blue-900',
    badge: 'bg-blue-100 text-blue-600',
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMonday(ref: Date): Date {
  const d = new Date(ref)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDates(ref: Date): Date[] {
  const monday = getMonday(ref)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

function topPx(time: string): number {
  return ((timeToMinutes(time) - START_HOUR * 60) / 60) * HOUR_PX
}

function heightPx(start: string, end: string): number {
  return ((timeToMinutes(end) - timeToMinutes(start)) / 60) * HOUR_PX
}

function getPatientLabel(rdv: RendezVous): string {
  if (rdv.patientPrenom && rdv.patientNom) {
    return `${rdv.patientPrenom} ${rdv.patientNom}`
  }
  return `Patient ${rdv.patientId.slice(0, 6)}…`
}

// ── RDV Block ───────────────────────────────────────────────────────────────

interface RdvBlockProps {
  rdv: RendezVous
  onSelect: (rdv: RendezVous) => void
  isSelected: boolean
}

function RdvBlock({ rdv, onSelect, isSelected }: RdvBlockProps) {
  const top = topPx(rdv.heureRdv)
  const endTime = `${String(Math.floor((timeToMinutes(rdv.heureRdv) + rdv.duree) / 60)).padStart(2, '0')}:${String((timeToMinutes(rdv.heureRdv) + rdv.duree) % 60).padStart(2, '0')}`
  const height = Math.max(heightPx(rdv.heureRdv, endTime), 28)
  const colors = STATUT_COLORS[rdv.statut]
  const compact = height < 44

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onSelect(rdv) }}
      className={clsx(
        'absolute left-0.5 right-0.5 rounded-md border-l-[3px] px-2 py-1 text-left transition-all cursor-pointer overflow-hidden',
        'hover:shadow-md hover:z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900',
        colors.bg, colors.border,
        isSelected && 'ring-2 ring-zinc-900 shadow-lg z-30',
      )}
      style={{ top, height }}
    >
      {compact ? (
        <p className={clsx('text-[11px] font-semibold truncate leading-tight', colors.text)}>
          {rdv.heureRdv} {getPatientLabel(rdv)}
        </p>
      ) : (
        <>
          <p className={clsx('text-[11px] font-bold leading-tight', colors.text)}>
            {rdv.heureRdv} – {endTime}
          </p>
          <p className={clsx('text-[11px] font-medium truncate', colors.text)}>
            {getPatientLabel(rdv)}
          </p>
          {height >= 60 && rdv.questionnaire?.message && (
            <p className="text-[10px] text-zinc-500 italic truncate mt-0.5">
              {rdv.questionnaire.message}
            </p>
          )}
        </>
      )}
    </button>
  )
}

// ── RDV Detail Panel ────────────────────────────────────────────────────────

interface RdvDetailPanelProps {
  rdv: RendezVous
  onClose: () => void
  onConfirm?: (id: string) => void
  onCancel?: (id: string) => void
  onTerminate?: (id: string) => void
}

function RdvDetailPanel({ rdv, onClose, onConfirm, onCancel, onTerminate }: RdvDetailPanelProps) {
  const motif = rdv.questionnaire?.message ?? rdv.motif
  const colors = STATUT_COLORS[rdv.statut]
  const endTime = `${String(Math.floor((timeToMinutes(rdv.heureRdv) + rdv.duree) / 60)).padStart(2, '0')}:${String((timeToMinutes(rdv.heureRdv) + rdv.duree) % 60).padStart(2, '0')}`

  return (
    <div className="absolute right-0 top-0 z-50 w-80 rounded-xl border border-zinc-200 bg-white shadow-2xl animate-in slide-in-from-right-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-semibold', colors.badge)}>
          {STATUT_LABELS[rdv.statut]}
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="space-y-3 px-4 py-4">
        {/* Patient */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600">
            {(rdv.patientPrenom?.[0] ?? 'P').toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">{getPatientLabel(rdv)}</p>
            <p className="text-xs text-zinc-500">{rdv.dateRdv}</p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-sm">
          <svg className="h-4 w-4 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-zinc-700 font-medium">{rdv.heureRdv} – {endTime}</span>
          <span className="text-zinc-400">({rdv.duree} min)</span>
        </div>

        {/* Motif */}
        {motif && (
          <div className="rounded-lg bg-zinc-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 mb-0.5">Message</p>
            <p className="text-sm text-zinc-700">{motif}</p>
          </div>
        )}

        {/* Type de consultation */}
        {rdv.questionnaire?.typeConsultation && (
          <p className="text-xs text-zinc-500">
            {rdv.questionnaire.typeConsultation === 'URGENCE' ? 'Urgence' : 'Consultation'}
          </p>
        )}
      </div>

      {/* Actions */}
      {(rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME') && (
        <div className="flex gap-2 border-t border-zinc-100 px-4 py-3">
          {rdv.statut === 'EN_ATTENTE' && onConfirm && (
            <button
              onClick={() => onConfirm(rdv.id)}
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Confirmer
            </button>
          )}
          {rdv.statut === 'CONFIRME' && onTerminate && (
            <button
              onClick={() => onTerminate(rdv.id)}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Terminer
            </button>
          )}
          {onCancel && (
            <button
              onClick={() => onCancel(rdv.id)}
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Current Time Indicator ──────────────────────────────────────────────────

function CurrentTimeIndicator() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const minutes = now.getHours() * 60 + now.getMinutes()
  const top = ((minutes - START_HOUR * 60) / 60) * HOUR_PX

  if (top < 0 || top > TOTAL_HEIGHT) return null

  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
      <div className="flex items-center">
        <div className="h-3 w-3 -ml-1.5 rounded-full bg-red-500 shadow-sm" />
        <div className="flex-1 h-[2px] bg-red-500" />
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

interface AgendaCalendarGridProps {
  weekDates: Date[]
  rdvs: RendezVous[]
  disponibilites: Disponibilite[]
  onConfirm?: (id: string) => void
  onCancel?: (id: string) => void
  onTerminate?: (id: string) => void
}

export function AgendaCalendarGrid({
  weekDates,
  rdvs,
  disponibilites,
  onConfirm,
  onCancel,
  onTerminate,
}: AgendaCalendarGridProps) {
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = toISO(today)

  // Build dispo map by day key
  const dispoByDay = new Map<string, Disponibilite[]>()
  disponibilites.forEach((d) => {
    const arr = dispoByDay.get(d.jourSemaine) ?? []
    arr.push(d)
    dispoByDay.set(d.jourSemaine, arr)
  })

  // Scroll to 7 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [weekDates])

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 240px)', minHeight: 500 }}>
      {/* Day headers */}
      <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-zinc-100 shrink-0">
        <div className="py-3 text-center text-[10px] font-medium text-zinc-300">GMT+1</div>
        {weekDates.map((date, i) => {
          const iso = toISO(date)
          const isToday = iso === todayISO
          const dayKey = JS_DAY_TO_KEY[date.getDay()]
          const hasDispos = (dispoByDay.get(dayKey) ?? []).length > 0

          return (
            <div key={iso} className={clsx('flex flex-col items-center py-2.5 border-l border-zinc-100', isToday && 'bg-blue-50/40')}>
              <span className={clsx(
                'text-[11px] font-bold uppercase tracking-wider',
                isToday ? 'text-blue-600' : 'text-zinc-400',
              )}>
                {DAYS_FR[i]}
              </span>
              <span className={clsx(
                'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold mt-0.5',
                isToday ? 'bg-blue-600 text-white' : 'text-zinc-800',
              )}>
                {date.getDate()}
              </span>
              {hasDispos && !isToday && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1" />
              )}
            </div>
          )
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="grid grid-cols-[52px_repeat(7,1fr)]" style={{ height: TOTAL_HEIGHT }}>
          {/* Hour labels */}
          <div className="relative">
            {HOURS.map((h) =>
              h < END_HOUR ? (
                <div
                  key={h}
                  className="absolute right-2 text-[11px] text-zinc-400 -translate-y-2"
                  style={{ top: (h - START_HOUR) * HOUR_PX }}
                >
                  {String(h).padStart(2, '0')}:00
                </div>
              ) : null,
            )}
          </div>

          {/* Day columns */}
          {weekDates.map((date, colIdx) => {
            const iso = toISO(date)
            const isToday = iso === todayISO
            const dayKey = JS_DAY_TO_KEY[date.getDay()]
            const dayDispos = dispoByDay.get(dayKey) ?? []
            const dayRdvs = rdvs.filter((r) => r.dateRdv === iso && r.statut !== 'ANNULE')

            return (
              <div
                key={iso}
                className={clsx(
                  'relative border-l border-zinc-100',
                  isToday && 'bg-blue-50/20',
                )}
                style={{ height: TOTAL_HEIGHT }}
              >
                {/* Hour grid lines */}
                {HOURS.map((h) =>
                  h < END_HOUR ? (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-zinc-100"
                      style={{ top: (h - START_HOUR) * HOUR_PX }}
                    />
                  ) : null,
                )}

                {/* Half-hour grid lines */}
                {HOURS.map((h) =>
                  h < END_HOUR ? (
                    <div
                      key={`${h}-30`}
                      className="absolute left-0 right-0 border-t border-zinc-50"
                      style={{ top: (h - START_HOUR) * HOUR_PX + HOUR_PX / 2 }}
                    />
                  ) : null,
                )}

                {/* Availability backdrop blocks */}
                {dayDispos.map((dispo) => {
                  const top = topPx(dispo.heureDebut)
                  const height = heightPx(dispo.heureDebut, dispo.heureFin)
                  return (
                    <div
                      key={dispo.id}
                      className="absolute left-0 right-0 bg-blue-50/60 border-y border-blue-100"
                      style={{ top, height }}
                    />
                  )
                })}

                {/* Current time indicator (only on today column) */}
                {isToday && <CurrentTimeIndicator />}

                {/* RDV blocks */}
                {dayRdvs.map((rdv) => (
                  <RdvBlock
                    key={rdv.id}
                    rdv={rdv}
                    isSelected={selectedRdv?.id === rdv.id}
                    onSelect={setSelectedRdv}
                  />
                ))}

                {/* RDV detail panel */}
                {selectedRdv && dayRdvs.some((r) => r.id === selectedRdv.id) && (
                  <RdvDetailPanel
                    rdv={selectedRdv}
                    onClose={() => setSelectedRdv(null)}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    onTerminate={onTerminate}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { getWeekDates, toISO }
