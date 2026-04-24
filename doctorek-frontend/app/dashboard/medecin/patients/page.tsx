'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { MedecinNav } from '@/components/MedecinNav'
import { usePatientsMedecin } from '@/features/agenda/hooks'
import { PatientListItem } from '@/features/agenda/components/PatientListItem'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'

const FILTRES = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'ACTIFS', label: 'Actifs (RDV à venir)' },
  { key: 'ANCIENS', label: 'Anciens' },
] as const

type Filtre = (typeof FILTRES)[number]['key']

const PAGE_SIZE = 20

export default function PatientsPage() {
  useRoleGuard('MEDECIN')
  const router = useRouter()

  const [medecinId, setMedecinId] = useState('')
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('TOUS')
  const [page, setPage] = useState(0)

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'MEDECIN' && session.id) {
      setMedecinId(session.id)
    }
  }, [])

  useEffect(() => {
    setPage(0)
  }, [search, filtre])

  const { data, isLoading, isError } = usePatientsMedecin(medecinId, search, filtre, page)

  const patients = data?.patients ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <Header />
      <MedecinNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Mes patients</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Liste des patients ayant pris rendez-vous avec vous.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle cx={11} cy={11} r={8} />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Rechercher un patient…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>

          <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
            {FILTRES.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFiltre(f.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtre === f.key
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {!medecinId ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
            <p className="text-sm text-zinc-400">Chargement…</p>
          </div>
        ) : isLoading ? (
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-10 w-10 rounded-full bg-zinc-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded bg-zinc-100 animate-pulse" />
                  <div className="h-2.5 w-28 rounded bg-zinc-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Impossible de charger les patients.
          </p>
        ) : patients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
            <p className="text-sm font-medium text-zinc-500">Aucun patient trouvé</p>
            {search && (
              <p className="mt-1 text-xs text-zinc-400">
                Aucun résultat pour &ldquo;{search}&rdquo;
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="border-b border-zinc-100 px-5 py-3 flex items-center justify-between">
                <p className="text-xs text-zinc-400">
                  {total} patient{total > 1 ? 's' : ''}
                </p>
              </div>
              <ul className="divide-y divide-zinc-100">
                {patients.map((patient) => (
                  <PatientListItem
                    key={patient.patientId}
                    patient={patient}
                    onClick={() => router.push(`/dashboard/medecin/patients/${patient.patientId}`)}
                  />
                ))}
              </ul>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="text-xs text-zinc-400">
                  Page {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
