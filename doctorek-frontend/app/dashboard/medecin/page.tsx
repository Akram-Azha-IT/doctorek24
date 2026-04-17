'use client'

import { useEffect, useRef, useState } from 'react'
import { Header } from '@/components/Header'
import { useDisponibilites, useRdvsMedecin } from '@/features/agenda/hooks'
import { AgendaView } from '@/features/agenda/components/AgendaView'
import { DisponibiliteForm } from '@/features/agenda/components/DisponibiliteForm'
import type { Disponibilite, RendezVous, StatutRdv } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'

const STATUT_LABELS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
}

const STATUT_COLORS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
  CONFIRME: 'bg-emerald-100 text-emerald-700',
  ANNULE: 'bg-red-100 text-red-600',
  TERMINE: 'bg-zinc-100 text-zinc-500',
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function weekRange(): { start: string; end: string } {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = (day === 0 ? -6 : 1 - day)
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  }
}

function slotsPerDisponibilite(d: Disponibilite): number {
  const [sh, sm] = d.heureDebut.split(':').map(Number)
  const [eh, em] = d.heureFin.split(':').map(Number)
  const totalMinutes = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(0, Math.floor(totalMinutes / d.dureeConsultation))
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white px-5 py-4">
      <span className={`text-2xl font-bold ${accent}`}>{value}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  )
}

export default function MedecinDashboardPage() {
  useRoleGuard('MEDECIN')

  const [medecinId, setMedecinId] = useState('')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const agendaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'MEDECIN' && session.id) {
      setMedecinId(session.id)
    }
  }, [])

  const { data: disponibilites, isLoading: loadingDispo, isError: errorDispo } = useDisponibilites(medecinId)
  const { data: rdvs } = useRdvsMedecin(medecinId)

  const today = todayISO()
  const { start: weekStart, end: weekEnd } = weekRange()

  const todayRdvs = (rdvs ?? []).filter((r) => r.dateRdv === today)
  const sortedTodayRdvs = [...todayRdvs].sort((a, b) => a.heureRdv.localeCompare(b.heureRdv))

  const confirmes = todayRdvs.filter((r) => r.statut === 'CONFIRME').length
  const enAttente = todayRdvs.filter((r) => r.statut === 'EN_ATTENTE').length
  const annules = todayRdvs.filter((r) => r.statut === 'ANNULE').length

  const weekRdvs = (rdvs ?? []).filter(
    (r) => r.dateRdv >= weekStart && r.dateRdv <= weekEnd && r.statut !== 'ANNULE',
  )
  const totalWeeklySlots = (disponibilites ?? []).reduce(
    (sum, d) => sum + slotsPerDisponibilite(d),
    0,
  )
  const occupationRate =
    totalWeeklySlots > 0 ? Math.round((weekRdvs.length / totalWeeklySlots) * 100) : null

  const byDay = new Map<string, Disponibilite[]>()
  ;(disponibilites ?? []).forEach((d) => {
    const arr = byDay.get(d.jourSemaine) ?? []
    arr.push(d)
    byDay.set(d.jourSemaine, arr)
  })

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 space-y-10">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </p>
        </div>

        {!medecinId ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
            <p className="text-sm text-zinc-400">Chargement du tableau de bord…</p>
          </div>
        ) : (
          <>
            {/* Stats du jour */}
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Aujourd'hui
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="RDVs du jour" value={todayRdvs.length} accent="text-zinc-900" />
                <StatCard label="Confirmés" value={confirmes} accent="text-emerald-600" />
                <StatCard label="En attente" value={enAttente} accent="text-yellow-600" />
                <StatCard label="Annulés" value={annules} accent="text-red-500" />
              </div>
            </section>

            {/* Taux d'occupation semaine */}
            {occupationRate !== null && (
              <section>
                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                  Occupation cette semaine
                </h2>
                <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-600">
                      {weekRdvs.length} RDV sur {totalWeeklySlots} créneaux disponibles
                    </span>
                    <span className="text-sm font-bold text-zinc-900">{occupationRate} %</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 rounded-full transition-all"
                      style={{ width: `${Math.min(occupationRate, 100)}%` }}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* RDVs d'aujourd'hui */}
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Rendez-vous du jour
              </h2>
              {sortedTodayRdvs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-10 text-center">
                  <p className="text-sm text-zinc-400">Aucun rendez-vous aujourd'hui</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white overflow-hidden">
                  {sortedTodayRdvs.map((rdv) => (
                    <TodayRdvRow key={rdv.id} rdv={rdv} />
                  ))}
                </div>
              )}
            </section>

            {/* Actions rapides */}
            <section>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Actions rapides
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => agendaRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                >
                  Gérer les disponibilités
                </button>
                <button
                  type="button"
                  onClick={() => agendaRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                >
                  Voir l'agenda
                </button>
              </div>
            </section>

            {/* Agenda / Disponibilités */}
            <section ref={agendaRef}>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Mon agenda
              </h2>

              {loadingDispo && (
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-100" />
                  ))}
                </div>
              )}

              {errorDispo && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  Impossible de charger les disponibilités.
                </p>
              )}

              {!loadingDispo && !errorDispo && disponibilites && (
                <>
                  <div className="mb-4 text-sm text-zinc-500">
                    {disponibilites.length === 0
                      ? 'Aucun jour configuré — cliquez sur un jour pour commencer'
                      : `${disponibilites.length} créneau${disponibilites.length > 1 ? 'x' : ''} configuré${disponibilites.length > 1 ? 's' : ''}`}
                  </div>
                  <AgendaView
                    disponibilites={disponibilites}
                    selectedDay={selectedDay}
                    onSelectDay={(day) =>
                      setSelectedDay((prev) => (prev === day ? null : day))
                    }
                  />
                  {selectedDay && (
                    <DisponibiliteForm
                      medecinId={medecinId}
                      selectedDay={selectedDay}
                      existing={byDay.get(selectedDay) ?? []}
                      onSaved={() => setSelectedDay(null)}
                    />
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>
    </>
  )
}

function TodayRdvRow({ rdv }: { rdv: RendezVous }) {
  const shortId = rdv.patientId.slice(0, 8)
  const motif = rdv.questionnaire?.motif ?? rdv.motif

  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-4">
        <span className="w-12 text-sm font-semibold text-zinc-900 tabular-nums">
          {rdv.heureRdv}
        </span>
        <div>
          <p className="text-sm text-zinc-700 font-mono">Patient {shortId}…</p>
          {motif && (
            <p className="text-xs text-zinc-400 italic truncate max-w-[280px]">{motif}</p>
          )}
        </div>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUT_COLORS[rdv.statut]}`}>
        {STATUT_LABELS[rdv.statut]}
      </span>
    </div>
  )
}
