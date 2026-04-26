'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Header } from '@/components/Header'
import { MedecinCardList } from '@/features/annuaire/components/MedecinCardList'
import { useSearchMedecinsDisponibles } from '@/features/annuaire/hooks'
import type { SearchFormValues } from '@/features/annuaire/schemas'
import type { DisponibiliteFilter } from '@/lib/disponibilite'

const DISPO_FILTERS: ReadonlyArray<{ value: DisponibiliteFilter; label: string }> = [
  { value: 'all', label: 'Toutes dates' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
]

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 10h10M11 16h2" />
    </svg>
  )
}

function SkeletonCards() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-zinc-100" />
      ))}
    </div>
  )
}

export default function RecherchePage() {
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<DisponibiliteFilter>('all')

  const { register, watch } = useForm<SearchFormValues>({
    defaultValues: {
      specialite: searchParams.get('specialite') ?? '',
      ville: searchParams.get('ville') ?? '',
    },
  })

  const [query, setQuery] = useState<SearchFormValues>({
    specialite: searchParams.get('specialite') ?? '',
    ville: searchParams.get('ville') ?? '',
  })

  const values = watch()
  useEffect(() => {
    setQuery({ specialite: values.specialite, ville: values.ville })
  }, [values.specialite, values.ville]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, isError, error } = useSearchMedecinsDisponibles(
    query.specialite,
    query.ville,
    filter,
  )

  const medecins = data?.medecins ?? []
  const availableTodayIds = data?.availableTodayIds ?? new Set<string>()

  const resultLabel = isLoading
    ? 'Chargement...'
    : `${medecins.length} médecin${medecins.length !== 1 ? 's' : ''} trouvé${medecins.length !== 1 ? 's' : ''}${query.specialite ? ` · ${query.specialite}` : ''}${query.ville ? ` à ${query.ville}` : ''}`

  return (
    <>
      <Header />

      {/* ── Search banner ── */}
      <div className="bg-[#064178] px-4 py-4 shadow-lg">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-0 overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-zinc-200">
            {/* Specialty */}
            <div className="flex flex-1 items-center gap-2.5 px-4 py-3">
              <SearchIcon />
              <input
                placeholder="Médecin, spécialité, clinique..."
                className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                {...register('specialite')}
              />
            </div>

            <div className="h-9 w-px bg-zinc-200" />

            {/* City */}
            <div className="flex flex-1 items-center gap-2.5 px-4 py-3">
              <LocationIcon />
              <input
                placeholder="Ville, code postal..."
                className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                {...register('ville')}
              />
            </div>

            {/* Search button */}
            <button
              type="button"
              className="flex items-center gap-2 rounded-r-xl bg-[#1863A9] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#0C4A83] active:bg-[#064178]"
            >
              <SearchIcon />
              <span className="hidden sm:inline">Rechercher</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="sticky top-[49px] z-10 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 overflow-x-auto">
          <button
            type="button"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
          >
            <FilterIcon />
            Filtres
          </button>

          <div className="h-5 w-px shrink-0 bg-zinc-200" />

          {/* Availability filter */}
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-0.5">
            {DISPO_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-[#1863A9] text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="mx-auto flex max-w-6xl">

        {/* Left: results list */}
        <div className="flex-1 min-w-0 px-4 py-5">
          {/* Result summary */}
          <p className="mb-4 text-sm text-zinc-500">{resultLabel}</p>

          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {(error as Error).message}
            </div>
          )}

          {isLoading && <SkeletonCards />}

          {!isLoading && data && medecins.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#DFEFFE]">
                <SearchIcon />
              </div>
              <p className="text-sm font-medium text-zinc-700">Aucun médecin trouvé</p>
              <p className="mt-1 text-xs text-zinc-400">
                {filter !== 'all'
                  ? 'Essayez "Toutes dates" pour élargir la recherche.'
                  : 'Essayez une autre spécialité ou ville.'}
              </p>
            </div>
          )}

          {!isLoading && medecins.length > 0 && (
            <div className="flex flex-col">
              {medecins.map((medecin) => (
                <MedecinCardList
                  key={medecin.id}
                  medecin={medecin}
                  availableToday={availableTodayIds.has(medecin.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: sticky map */}
        <div className="hidden lg:block w-[380px] shrink-0">
          <div className="sticky top-[97px] h-[calc(100vh-97px)] overflow-hidden rounded-tl-xl border-l border-zinc-200">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=-8.5,31.5,-4.5,34.5&layer=mapnik&marker=33.57,-7.59"
              className="h-full w-full border-0"
              title="Carte des médecins"
              loading="lazy"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-600 shadow-md backdrop-blur-sm ring-1 ring-zinc-200">
                Carte interactive
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
