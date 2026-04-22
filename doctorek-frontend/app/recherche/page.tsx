'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { SearchForm } from '@/features/annuaire/components/SearchForm'
import { MedecinCard } from '@/features/annuaire/components/MedecinCard'
import { useSearchMedecinsDisponibles } from '@/features/annuaire/hooks'
import type { SearchFormValues } from '@/features/annuaire/schemas'
import type { DisponibiliteFilter } from '@/lib/disponibilite'

const FILTERS: ReadonlyArray<{ value: DisponibiliteFilter; label: string }> = [
  { value: 'all', label: 'Toutes dates' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
]

export default function RecherchePage() {
  const [query, setQuery] = useState<SearchFormValues>({ specialite: '', ville: '' })
  const [filter, setFilter] = useState<DisponibiliteFilter>('all')

  const { data, isLoading, isError, error } = useSearchMedecinsDisponibles(
    query.specialite,
    query.ville,
    filter,
  )

  const medecins = data?.medecins ?? []
  const availableTodayIds = data?.availableTodayIds ?? new Set<string>()

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Trouver un médecin</h1>
          <p className="text-zinc-500 text-sm">
            {data
              ? `${medecins.length} médecin${medecins.length !== 1 ? 's' : ''} trouvé${medecins.length !== 1 ? 's' : ''}`
              : 'Chargement...'}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm mb-4">
          <SearchForm onSearch={setQuery} isLoading={isLoading} />
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Disponibilité
          </span>
          <div className="inline-flex rounded-full border border-zinc-200 bg-white p-1 shadow-sm">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isError && (
          <p className="text-center text-sm text-red-500 py-8">
            {(error as Error).message}
          </p>
        )}

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-100" />
            ))}
          </div>
        )}

        {!isLoading && data && medecins.length === 0 && (
          <p className="text-center text-sm text-zinc-500 py-8">
            {filter === 'today'
              ? "Aucun médecin disponible aujourd'hui."
              : filter === 'week'
              ? 'Aucun médecin disponible cette semaine.'
              : 'Aucun médecin trouvé pour cette recherche.'}
          </p>
        )}

        {!isLoading && medecins.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {medecins.map((medecin) => (
              <MedecinCard
                key={medecin.id}
                medecin={medecin}
                availableToday={availableTodayIds.has(medecin.id)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
