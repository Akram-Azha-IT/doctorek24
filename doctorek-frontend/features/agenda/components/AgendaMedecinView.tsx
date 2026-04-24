'use client'

import { useState } from 'react'
import type { RendezVous, Disponibilite } from '@/lib/types'
import { useConfirmerRdv, useAnnulerRdvMedecin, useTerminerRdv, useCreneaux } from '../hooks'
import { AgendaCalendarGrid, getWeekDates, toISO } from './AgendaCalendarGrid'

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

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

function formatDateFR(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
}

function formatDateFullFR(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

type ViewMode = 'jour' | 'semaine'

// ── Main Component ───────────────────────────────────────────────────────────

interface AgendaMedecinViewProps {
  medecinId: string
  rdvs: RendezVous[]
  disponibilites: Disponibilite[]
}

export function AgendaMedecinView({ medecinId, rdvs, disponibilites }: AgendaMedecinViewProps) {
  const [view, setView] = useState<ViewMode>('semaine')
  const [refDate, setRefDate] = useState(() => new Date())

  const confirmMutation = useConfirmerRdv(medecinId)
  const cancelMutation = useAnnulerRdvMedecin(medecinId)
  const terminateMutation = useTerminerRdv(medecinId)

  const weekDates = getWeekDates(refDate)
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]

  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  const isCurrentWeek = weekDates.some((d) => {
    const copy = new Date(d); copy.setHours(0, 0, 0, 0)
    return copy.getTime() === todayDate.getTime()
  })

  const isCurrentDay = toISO(refDate) === toISO(todayDate)

  function navigateWeek(dir: -1 | 1) {
    setRefDate((prev) => addDays(prev, dir * 7))
  }

  function navigateDay(dir: -1 | 1) {
    setRefDate((prev) => addDays(prev, dir))
  }

  function goToday() {
    setRefDate(new Date())
  }

  const periodLabel = view === 'semaine'
    ? `${formatDateFR(weekStart)} – ${formatDateFR(weekEnd)} ${weekEnd.getFullYear()}`
    : formatDateFullFR(refDate)

  const showTodayBtn = view === 'semaine' ? !isCurrentWeek : !isCurrentDay

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
          {(['jour', 'semaine'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${
                view === v
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              {v === 'jour' ? 'Jour' : 'Semaine'}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 sm:ml-auto">
          {showTodayBtn && (
            <button
              onClick={goToday}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
              Aujourd&apos;hui
            </button>
          )}

          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => view === 'semaine' ? navigateWeek(-1) : navigateDay(-1)}
              aria-label="Précédent"
              className="px-3 py-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            <span className="min-w-[200px] text-center text-sm font-semibold text-zinc-900 px-2 capitalize">
              {periodLabel}
            </span>

            <button
              onClick={() => view === 'semaine' ? navigateWeek(1) : navigateDay(1)}
              aria-label="Suivant"
              className="px-3 py-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-blue-50 border border-blue-200" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-emerald-50 border-l-2 border-emerald-500" />
          Confirmé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-amber-50 border-l-2 border-amber-400" />
          En attente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-blue-50 border-l-2 border-blue-300" />
          Terminé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[2px] w-4 bg-red-500 rounded" />
          Maintenant
        </span>
      </div>

      {/* Calendar view */}
      {view === 'semaine' ? (
        <AgendaCalendarGrid
          weekDates={weekDates}
          rdvs={rdvs}
          disponibilites={disponibilites}
          onConfirm={(id) => confirmMutation.mutate(id)}
          onCancel={(id) => cancelMutation.mutate(id)}
          onTerminate={(id) => terminateMutation.mutate(id)}
        />
      ) : (
        <DayView
          date={refDate}
          rdvs={rdvs}
          disponibilites={disponibilites}
          medecinId={medecinId}
          onConfirm={(id) => confirmMutation.mutate(id)}
          onCancel={(id) => cancelMutation.mutate(id)}
          onTerminate={(id) => terminateMutation.mutate(id)}
        />
      )}
    </div>
  )
}

// ── Day View ─────────────────────────────────────────────────────────────────

interface DayViewProps {
  date: Date
  rdvs: RendezVous[]
  disponibilites: Disponibilite[]
  medecinId: string
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
  onTerminate: (id: string) => void
}

const STATUT_BLOCK_BG: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-50 border-l-4 border-amber-400',
  CONFIRME: 'bg-emerald-50 border-l-4 border-emerald-500',
  ANNULE: 'bg-zinc-50 border-l-4 border-zinc-300 opacity-60',
  TERMINE: 'bg-blue-50 border-l-4 border-blue-300',
}

function DayView({ date, rdvs, disponibilites, medecinId, onConfirm, onCancel, onTerminate }: DayViewProps) {
  const iso = toISO(date)
  const { data: creneaux, isLoading } = useCreneaux(medecinId, iso)
  const isToday = iso === toISO(new Date())
  const dayRdvs = rdvs.filter((r) => r.dateRdv === iso).sort((a, b) => a.heureRdv.localeCompare(b.heureRdv))

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Day header */}
      <div className={`px-6 py-4 border-b border-zinc-100 ${isToday ? 'bg-blue-50/40' : ''}`}>
        <p className={`text-lg font-semibold capitalize ${isToday ? 'text-blue-700' : 'text-zinc-900'}`}>
          {formatDateFullFR(date)}
        </p>
        {isToday && <p className="text-xs text-blue-500 mt-0.5">Aujourd&apos;hui</p>}
      </div>

      {/* Slots */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-zinc-100 animate-pulse" />
            ))}
          </div>
        ) : creneaux && creneaux.length > 0 ? (
          <div className="space-y-1.5">
            {creneaux.map((creneau) => {
              const rdv = dayRdvs.find((r) => r.heureRdv === creneau.debut)
              if (rdv) {
                return (
                  <div key={rdv.id} className={`rounded-lg px-4 py-3 ${STATUT_BLOCK_BG[rdv.statut]}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold tabular-nums text-zinc-800">{rdv.heureRdv} – {creneau.fin}</span>
                        <span className="ml-3 text-sm text-zinc-700">
                          {rdv.patientPrenom && rdv.patientNom
                            ? `${rdv.patientPrenom} ${rdv.patientNom}`
                            : `Patient ${rdv.patientId.slice(0, 6)}…`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {rdv.statut === 'EN_ATTENTE' && (
                          <button onClick={() => onConfirm(rdv.id)} className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                            Confirmer
                          </button>
                        )}
                        {rdv.statut === 'CONFIRME' && (
                          <button onClick={() => onTerminate(rdv.id)} className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                            Terminer
                          </button>
                        )}
                        {(rdv.statut === 'EN_ATTENTE' || rdv.statut === 'CONFIRME') && (
                          <button onClick={() => onCancel(rdv.id)} className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                    {rdv.questionnaire?.motif && (
                      <p className="mt-1 text-xs text-zinc-500 italic">{rdv.questionnaire.motif}</p>
                    )}
                  </div>
                )
              }
              return (
                <div key={creneau.debut} className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-200 px-4 py-3 text-zinc-400">
                  <span className="tabular-nums text-sm font-medium">{creneau.debut}</span>
                  <span className="text-xs">Créneau libre</span>
                  <span className="ml-auto text-xs text-zinc-300">{creneau.fin}</span>
                </div>
              )
            })}
          </div>
        ) : dayRdvs.length > 0 ? (
          <div className="space-y-2">
            {dayRdvs.map((rdv) => (
              <div key={rdv.id} className={`rounded-lg px-4 py-3 ${STATUT_BLOCK_BG[rdv.statut]}`}>
                <span className="text-sm font-bold text-zinc-800">{rdv.heureRdv}</span>
                <span className="ml-3 text-sm text-zinc-700">
                  {rdv.patientPrenom ? `${rdv.patientPrenom} ${rdv.patientNom}` : `Patient ${rdv.patientId.slice(0, 6)}…`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
            <p className="text-sm text-zinc-400">Aucun rendez-vous ce jour</p>
          </div>
        )}
      </div>
    </div>
  )
}
