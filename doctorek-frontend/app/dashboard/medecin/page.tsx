'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { MedecinNav } from '@/components/MedecinNav'
import { useRdvsMedecin, useDisponibilites } from '@/features/agenda/hooks'
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
  return localDateISO(new Date())
}

function localDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekRange(): { monday: string; sunday: string } {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { monday: localDateISO(monday), sunday: localDateISO(sunday) }
}

function computeTotalWeekSlots(disponibilites: Disponibilite[]): number {
  return disponibilites.reduce((total, dispo) => {
    const [sh, sm] = dispo.heureDebut.split(':').map(Number)
    const [eh, em] = dispo.heureFin.split(':').map(Number)
    const minutes = eh * 60 + em - (sh * 60 + sm)
    return total + Math.floor(minutes / dispo.dureeConsultation)
  }, 0)
}

function patientName(rdv: RendezVous): string {
  if (rdv.patientPrenom || rdv.patientNom) {
    return `${rdv.patientPrenom ?? ''} ${rdv.patientNom ?? ''}`.trim()
  }
  return `Patient ${rdv.patientId.slice(0, 8)}…`
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white px-5 py-4">
      <span className={`text-2xl font-bold ${accent}`}>{value}</span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  )
}

function ProchainRdvCard({ rdv }: { rdv: RendezVous }) {
  const motif = rdv.questionnaire?.motif ?? rdv.motif
  const isToday = rdv.dateRdv === todayISO()
  const dateLabel = isToday
    ? "Aujourd'hui"
    : new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(
        new Date(rdv.dateRdv + 'T00:00:00')
      )

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">{dateLabel}</p>
          <p className="mt-0.5 text-base font-semibold text-zinc-900">
            {rdv.heureRdv} — {patientName(rdv)}
          </p>
          {motif && (
            <p className="mt-0.5 max-w-xs truncate text-sm italic text-zinc-500">{motif}</p>
          )}
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUT_COLORS[rdv.statut]}`}>
        {STATUT_LABELS[rdv.statut]}
      </span>
    </div>
  )
}

function TauxOccupationBar({ rdvs, disponibilites }: { rdvs: RendezVous[]; disponibilites: Disponibilite[] }) {
  const { monday, sunday } = getWeekRange()
  const totalSlots = computeTotalWeekSlots(disponibilites)

  const bookedCount = rdvs.filter(
    (r) => r.dateRdv >= monday && r.dateRdv <= sunday && r.statut !== 'ANNULE'
  ).length

  const taux = totalSlots > 0 ? Math.min(Math.round((bookedCount / totalSlots) * 100), 100) : 0

  const barColor =
    taux >= 80 ? 'bg-red-400' : taux >= 50 ? 'bg-yellow-400' : 'bg-emerald-400'

  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Taux d'occupation — semaine en cours
        </span>
        <span className="text-sm font-bold text-zinc-800">{taux}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${taux}%` }}
        />
      </div>
      <p className="text-xs text-zinc-400">
        {bookedCount} RDV réservé{bookedCount > 1 ? 's' : ''} sur {totalSlots || '—'} créneaux disponibles
      </p>
    </div>
  )
}


export default function MedecinDashboardPage() {
  useRoleGuard('MEDECIN')

  const [medecinId, setMedecinId] = useState('')
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'MEDECIN' && session.id) {
      setMedecinId(session.id)
      setFirstName(session.firstName ?? '')
    }
  }, [])

  const { data: rdvs } = useRdvsMedecin(medecinId)
  const { data: disponibilites } = useDisponibilites(medecinId)

  const today = todayISO()
  const allRdvs = rdvs ?? []
  const allDispos = disponibilites ?? []

  const todayRdvs = allRdvs.filter((r) => r.dateRdv === today)
  const confirmes = todayRdvs.filter((r) => r.statut === 'CONFIRME').length
  const enAttente = todayRdvs.filter((r) => r.statut === 'EN_ATTENTE').length
  const annules = todayRdvs.filter((r) => r.statut === 'ANNULE').length

  const prochainRdv = [...allRdvs]
    .filter((r) => r.dateRdv >= today && r.statut !== 'ANNULE')
    .sort((a, b) => a.dateRdv.localeCompare(b.dateRdv) || a.heureRdv.localeCompare(b.heureRdv))[0] ?? null

  return (
    <>
      <Header />
      <MedecinNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 space-y-10">

        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Bonjour{firstName ? `, Dr. ${firstName}` : ''} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {new Intl.DateTimeFormat('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            }).format(new Date())}
          </p>
        </div>

        {!medecinId ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
            <p className="text-sm text-zinc-400">Chargement…</p>
          </div>
        ) : (
          <>
            {/* Stats du jour */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Aujourd'hui
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="RDVs du jour" value={todayRdvs.length} accent="text-zinc-900" />
                <StatCard label="Confirmés" value={confirmes} accent="text-emerald-600" />
                <StatCard label="En attente" value={enAttente} accent="text-yellow-600" />
                <StatCard label="Annulés" value={annules} accent="text-red-500" />
              </div>
            </section>

            {/* Prochain RDV */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Prochain rendez-vous
              </h2>
              {prochainRdv ? (
                <ProchainRdvCard rdv={prochainRdv} />
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-8 text-center">
                  <p className="text-sm text-zinc-400">Aucun rendez-vous à venir</p>
                </div>
              )}
            </section>

            {/* Taux occupation semaine */}
            <TauxOccupationBar rdvs={allRdvs} disponibilites={allDispos} />

          </>
        )}
      </main>
    </>
  )
}
