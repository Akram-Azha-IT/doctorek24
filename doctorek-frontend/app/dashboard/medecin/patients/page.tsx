'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePatientsMedecin } from '@/features/agenda/hooks'
import { PatientFamilleList } from '@/features/agenda/components/PatientFamilleList'
import { ErrorState } from '@/components/ErrorState'
import { ResilientState } from '@/components/ResilientState'
import { useSession } from '@/lib/useSession'
import { useResetOnChange } from '@/lib/useResetOnChange'
import { useRoleGuard } from '@/lib/useRoleGuard'
import type { PatientSummary } from '@/lib/types'

const FILTRES = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'ACTIFS', label: 'Actifs' },
  { key: 'ANCIENS', label: 'Anciens' },
] as const

type Filtre = (typeof FILTRES)[number]['key']

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

export default function PatientsPage() {
  useRoleGuard('MEDECIN')
  const router = useRouter()

  const session = useSession()
  const medecinId = session?.role === 'MEDECIN' && session.id ? session.id : ''
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('TOUS')
  const [page, setPage] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [search])

  // Reset pagination quand la recherche/le filtre change.
  useResetOnChange(`${debouncedSearch}|${filtre}`, () => setPage(0))

  const { data, error, isLoading, isError, isFetching, refetch } = usePatientsMedecin(
    medecinId,
    debouncedSearch,
    filtre,
    page,
  )

  const patients = data?.content ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const openPatient = useCallback(
    (patient: PatientSummary) => {
      const params = new URLSearchParams({ prenom: patient.firstName, nom: patient.lastName })
      router.push(`/dashboard/medecin/patients/${patient.patientId}?${params}`)
    },
    [router],
  )

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-7 md:py-10 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] md:text-[26px] font-extrabold leading-tight tracking-tight text-[#010C2D]">
            Mes patients
          </h1>
          <p className="mt-1 text-sm text-[#465058]">
            Patients ayant pris rendez-vous avec vous.
          </p>
        </div>
        {total > 0 && (
          <span className="inline-flex items-baseline gap-1.5 rounded-xl bg-[#EBF4FF] px-3.5 py-2">
            <span className="text-lg font-extrabold tabular-nums leading-none text-[#007DFF]">{total}</span>
            <span className="text-xs font-semibold text-[#1863A9]">
              patient{total > 1 ? 's' : ''}
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A0AEC0]"
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
            className="w-full rounded-xl border border-[#E3E8EF] bg-white py-2.5 pl-9 pr-4 text-sm text-[#010C2D] placeholder-[#A0AEC0] transition-shadow focus:border-[#007DFF] focus:outline-none focus:ring-2 focus:ring-[#007DFF]/20"
          />
        </div>

        <div
          role="tablist"
          aria-label="Filtrer les patients"
          className="flex gap-1 self-start rounded-xl border border-[#E3E8EF] bg-[#F0F2F5] p-1"
        >
          {FILTRES.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filtre === f.key}
              onClick={() => setFiltre(f.key)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filtre === f.key
                  ? 'bg-white text-[#010C2D] shadow-sm'
                  : 'text-[#6B7A99] hover:text-[#010C2D]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!medecinId || isLoading ? (
        <div className="overflow-hidden rounded-2xl border border-[#EEF1F6] bg-white">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-[#F0F2F5]' : ''}`}>
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#F0F2F5]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 animate-pulse rounded bg-[#F0F2F5]" />
                <div className="h-2.5 w-28 animate-pulse rounded bg-[#F0F2F5]" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} isRetrying={isFetching} />
      ) : patients.length === 0 ? (
        <ResilientState
          variant="empty"
          title="Aucun patient trouvé"
          description={
            debouncedSearch
              ? `Aucun résultat pour « ${debouncedSearch} ». Essayez un autre nom.`
              : 'Les patients apparaîtront ici automatiquement après leur premier rendez-vous.'
          }
          primaryAction={
            debouncedSearch
              ? { label: 'Effacer la recherche', onClick: () => setSearch('') }
              : undefined
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-[#EEF1F6] bg-white">
            <PatientFamilleList patients={patients} onOpen={openPatient} />
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-[#E3E8EF] bg-white px-4 py-2 text-sm font-semibold text-[#465058] transition-colors hover:bg-[#F0F2F5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="text-xs tabular-nums text-[#6B7A99]">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} sur {total}
              </span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-[#E3E8EF] bg-white px-4 py-2 text-sm font-semibold text-[#465058] transition-colors hover:bg-[#F0F2F5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
