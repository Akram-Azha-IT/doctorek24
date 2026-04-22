'use client'

import { useState } from 'react'
import type { RendezVous, StatutRdv } from '@/lib/types'

const STATUT_LABELS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
}

const STATUT_COLORS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRME: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ANNULE: 'bg-red-50 text-red-500 border-red-200',
  TERMINE: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}

const STATUT_BLOCK_BG: Record<StatutRdv, string> = {
  EN_ATTENTE: 'bg-yellow-50 border-l-4 border-yellow-400',
  CONFIRME: 'bg-emerald-50 border-l-4 border-emerald-500',
  ANNULE: 'bg-zinc-50 border-l-4 border-zinc-300 opacity-60',
  TERMINE: 'bg-blue-50 border-l-4 border-blue-300',
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_FULL_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatDateFR(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(date)
}

function getPatientLabel(rdv: RendezVous): string {
  return `Patient ${rdv.patientId.slice(0, 6)}…`
}

// ── RDV block shown in day/week view ─────────────────────────────────────────

interface RdvBlockProps {
  rdv: RendezVous
  compact?: boolean
}

function RdvBlock({ rdv, compact = false }: RdvBlockProps) {
  const [expanded, setExpanded] = useState(false)

  const motif = rdv.questionnaire?.motif ?? rdv.motif

  return (
    <div
      className={`rounded-lg px-3 py-2 cursor-pointer transition-all ${STATUT_BLOCK_BG[rdv.statut]} ${expanded ? 'shadow-md' : 'hover:shadow-sm'}`}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold tabular-nums text-zinc-800 shrink-0">
            {rdv.heureRdv}
          </span>
          {!compact && (
            <span className="text-sm text-zinc-700 truncate">{getPatientLabel(rdv)}</span>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium border ${STATUT_COLORS[rdv.statut]}`}>
          {STATUT_LABELS[rdv.statut]}
        </span>
      </div>

      {compact && (
        <p className="mt-0.5 text-xs text-zinc-500 truncate">{getPatientLabel(rdv)}</p>
      )}

      {expanded && (
        <div
          className="mt-3 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          {motif && (
            <p className="text-xs text-zinc-600 italic">
              <span className="font-medium not-italic">Motif : </span>{motif}
            </p>
          )}
          {rdv.questionnaire?.premierConsultation !== undefined && (
            <p className="text-xs text-zinc-500">
              {rdv.questionnaire.premierConsultation ? '1ère consultation' : 'Consultation de suivi'}
            </p>
          )}
          <p className="text-xs text-zinc-400">Durée : {rdv.duree} min</p>

        </div>
      )}
    </div>
  )
}

// ── Day view ──────────────────────────────────────────────────────────────────

interface DayViewProps {
  date: Date
  rdvs: RendezVous[]
  medecinId: string
  onPrev: () => void
  onNext: () => void
}

function DayView({ date, rdvs, medecinId, onPrev, onNext }: DayViewProps) {
  const iso = toISO(date)
  const dayRdvs = rdvs
    .filter((r) => r.dateRdv === iso)
    .sort((a, b) => a.heureRdv.localeCompare(b.heureRdv))

  const isToday = iso === toISO(new Date())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          ← Hier
        </button>
        <div className="text-center">
          <p className={`text-lg font-semibold ${isToday ? 'text-emerald-600' : 'text-zinc-900'}`}>
            {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)}
          </p>
          {isToday && <p className="text-xs text-emerald-500">Aujourd'hui</p>}
        </div>
        <button
          onClick={onNext}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Demain →
        </button>
      </div>

      {dayRdvs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
          <p className="text-sm text-zinc-400">Aucun rendez-vous ce jour</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayRdvs.map((rdv) => (
            <RdvBlock key={rdv.id} rdv={rdv} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Week view ─────────────────────────────────────────────────────────────────

interface WeekViewProps {
  monday: Date
  rdvs: RendezVous[]
  medecinId: string
  onPrev: () => void
  onNext: () => void
}

function WeekView({ monday, rdvs, medecinId, onPrev, onNext }: WeekViewProps) {
  const sunday = addDays(monday, 6)
  const todayISO = toISO(new Date())

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          ← Sem. préc.
        </button>
        <p className="text-sm font-medium text-zinc-600">
          {formatDateFR(monday)} – {formatDateFR(sunday)}
        </p>
        <button
          onClick={onNext}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Sem. suiv. →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, i) => {
          const iso = toISO(day)
          const dayRdvs = rdvs
            .filter((r) => r.dateRdv === iso)
            .sort((a, b) => a.heureRdv.localeCompare(b.heureRdv))
          const isToday = iso === todayISO

          return (
            <div key={iso} className="min-w-0">
              <div className={`mb-1.5 rounded-lg px-1 py-1 text-center ${isToday ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
                <p className={`text-xs font-medium ${isToday ? 'text-white' : 'text-zinc-500'}`}>
                  {DAYS_FR[i]}
                </p>
                <p className={`text-sm font-bold ${isToday ? 'text-white' : 'text-zinc-800'}`}>
                  {day.getDate()}
                </p>
              </div>

              <div className="space-y-1">
                {dayRdvs.length === 0 ? (
                  <div className="rounded-md bg-zinc-50 px-1 py-3 text-center">
                    <p className="text-xs text-zinc-300">—</p>
                  </div>
                ) : (
                  dayRdvs.map((rdv) => (
                    <RdvBlock key={rdv.id} rdv={rdv} compact />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────────────────

interface AgendaMedecinViewProps {
  medecinId: string
  rdvs: RendezVous[]
}

export function AgendaMedecinView({ medecinId, rdvs }: AgendaMedecinViewProps) {
  const [view, setView] = useState<'jour' | 'semaine'>('semaine')
  const [currentDay, setCurrentDay] = useState(() => new Date())
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()))

  return (
    <div className="space-y-5">
      {/* View toggle */}
      <div className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 w-fit">
        {(['jour', 'semaine'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all ${
              view === v
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {v === 'jour' ? 'Jour' : 'Semaine'}
          </button>
        ))}
      </div>

      {view === 'jour' ? (
        <DayView
          date={currentDay}
          rdvs={rdvs}
          medecinId={medecinId}
          onPrev={() => setCurrentDay((d) => addDays(d, -1))}
          onNext={() => setCurrentDay((d) => addDays(d, 1))}
        />
      ) : (
        <WeekView
          monday={currentMonday}
          rdvs={rdvs}
          medecinId={medecinId}
          onPrev={() => setCurrentMonday((d) => addDays(d, -7))}
          onNext={() => setCurrentMonday((d) => addDays(d, 7))}
        />
      )}
    </div>
  )
}
