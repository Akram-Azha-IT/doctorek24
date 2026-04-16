'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { useRdvsPatient } from '@/features/agenda/hooks'
import { useMedecin } from '@/features/annuaire/hooks'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import type { RendezVous, StatutRdv } from '@/lib/types'

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

function formatDateFR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function ProchainRdvCard({ rdv }: { rdv: RendezVous }) {
  const { data: medecin } = useMedecin(rdv.medecinId)
  const medecinNom = medecin ? `Dr ${medecin.firstName} ${medecin.lastName}` : 'Médecin...'

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-5">
      <p className="text-sm font-semibold text-blue-900">{medecinNom}</p>
      {medecin && <p className="text-xs text-blue-600">{medecin.specialite}</p>}
      <p className="mt-2 text-base font-medium text-blue-800">
        {formatDateFR(rdv.dateRdv)} à {rdv.heureRdv}
      </p>
      {rdv.motif && (
        <p className="mt-1 text-sm text-blue-700 italic">{rdv.motif}</p>
      )}
      <Link
        href="/patient/rdvs"
        className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
      >
        Voir tous mes rendez-vous →
      </Link>
    </div>
  )
}

function DernierRdvRow({ rdv }: { rdv: RendezVous }) {
  const { data: medecin } = useMedecin(rdv.medecinId)
  const medecinNom = medecin ? `Dr ${medecin.firstName} ${medecin.lastName}` : 'Médecin...'

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4">
      <div>
        <p className="text-sm font-medium text-zinc-800">{medecinNom}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{formatDateFR(rdv.dateRdv)} à {rdv.heureRdv}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUT_COLORS[rdv.statut]}`}>
        {STATUT_LABELS[rdv.statut]}
      </span>
    </div>
  )
}

export default function DashboardPatientPage() {
  useRoleGuard('PATIENT')

  const [patientId, setPatientId] = useState('')
  const [firstName, setFirstName] = useState<string | null>(null)

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'PATIENT' && session.id) {
      setPatientId(session.id)
      setFirstName(session.firstName ?? null)
    }
  }, [])

  const { data: rdvs = [], isLoading } = useRdvsPatient(patientId)

  const prochainRdv = rdvs
    .filter((r) => r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRME')
    .sort((a, b) => a.dateRdv.localeCompare(b.dateRdv))[0] ?? null

  const derniersRdvs = rdvs
    .slice()
    .sort((a, b) => b.dateRdv.localeCompare(a.dateRdv))
    .slice(0, 3)

  if (!patientId || isLoading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Bonjour, {firstName ?? 'Patient'}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Bienvenue sur votre espace santé</p>
        </div>

        {/* Prochain RDV */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-800">Votre prochain rendez-vous</h2>
          {prochainRdv ? (
            <ProchainRdvCard rdv={prochainRdv} />
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-8 text-center">
              <p className="text-sm text-zinc-400">Aucun rendez-vous à venir.</p>
              <Link
                href="/recherche"
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
              >
                Prendre un rendez-vous →
              </Link>
            </div>
          )}
        </section>

        {/* Actions rapides */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-800">Actions rapides</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/recherche"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Trouver un médecin
            </Link>
            <Link
              href="/patient/rdvs"
              className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Tous mes rendez-vous
            </Link>
          </div>
        </section>

        {/* Derniers RDVs */}
        {derniersRdvs.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-medium text-zinc-800">Derniers rendez-vous</h2>
            <div className="space-y-2">
              {derniersRdvs.map((rdv) => (
                <DernierRdvRow key={rdv.id} rdv={rdv} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
