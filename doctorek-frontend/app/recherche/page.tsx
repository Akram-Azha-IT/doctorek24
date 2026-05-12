'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Header } from '@/components/Header'
import { MedecinCardList } from '@/features/annuaire/components/MedecinCardList'
import type { DoctorMapEntry } from '@/features/annuaire/components/DoctorMap'
import {
  useGeolocation,
  useNearbyMedecins,
  useSearchMedecinsDisponibles,
} from '@/features/annuaire/hooks'
import type { SearchFormValues } from '@/features/annuaire/schemas'
import type { DisponibiliteFilter } from '@/lib/disponibilite'

const DoctorMap = dynamic(
  () => import('@/features/annuaire/components/DoctorMap').then((m) => ({ default: m.DoctorMap })),
  { ssr: false },
)

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

function LocationIcon({ className = 'h-4 w-4 shrink-0 text-zinc-400' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

function SpinnerIcon() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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

  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const nearbyParam = searchParams.get('nearby')
  const urlCoords =
    latParam && lngParam ? { lat: Number(latParam), lng: Number(lngParam) } : null

  const [filter, setFilter] = useState<DisponibiliteFilter>('all')
  const [nearbyMode, setNearbyMode] = useState(nearbyParam === '1' && urlCoords !== null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

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

  // ── Geolocation ──────────────────────────────────────────────────────────
  const { state: geoState, request: requestGeo } = useGeolocation()
  // URL coords take precedence (redirected from homepage), else use hook state
  const geoCoords =
    urlCoords ??
    (geoState.status === 'success' ? { lat: geoState.lat, lng: geoState.lng } : null)

  const handleNearbyClick = () => {
    if (nearbyMode) {
      setNearbyMode(false)
      return
    }
    if (geoState.status !== 'success' && !urlCoords) {
      requestGeo()
    }
    setNearbyMode(true)
  }

  useEffect(() => {
    if (nearbyMode && geoState.status === 'error' && !urlCoords) {
      setNearbyMode(false)
    }
  }, [nearbyMode, geoState.status, urlCoords])

  // ── Data queries ──────────────────────────────────────────────────────────
  const searchResult = useSearchMedecinsDisponibles(
    nearbyMode ? '' : query.specialite,
    nearbyMode ? '' : query.ville,
    filter,
  )

  const nearbyResult = useNearbyMedecins(
    geoCoords?.lat ?? null,
    geoCoords?.lng ?? null,
    20,
    query.specialite,
  )

  const isLoading = nearbyMode ? nearbyResult.isLoading : searchResult.isLoading
  const isError = nearbyMode ? nearbyResult.isError : searchResult.isError
  const error = nearbyMode ? nearbyResult.error : searchResult.error

  const nearbyMedecins = nearbyResult.data ?? []
  const searchMedecins = searchResult.data?.medecins ?? []
  const availableTodayIds = searchResult.data?.availableTodayIds ?? new Set<string>()

  const mapDoctors = useMemo<DoctorMapEntry[]>(() => {
    const source = nearbyMode ? nearbyMedecins.map((r) => r.medecin) : searchMedecins
    return source
      .filter((m) => m.latitude != null && m.longitude != null)
      .map((m) => {
        const name = `${m.firstName}${m.lastName}`
        const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        return {
          id: m.id,
          lat: m.latitude!,
          lng: m.longitude!,
          name: `Dr. ${m.firstName} ${m.lastName}`,
          photoUrl: m.photoUrl ?? null,
          initials: `${m.firstName[0] ?? ''}${m.lastName[0] ?? ''}`.toUpperCase(),
          avatarColor: `hsl(${hash % 360}, 55%, 42%)`,
        }
      })
  }, [nearbyMode, nearbyMedecins, searchMedecins])

  const resultCount = nearbyMode ? nearbyMedecins.length : searchMedecins.length
  const resultLabel = isLoading
    ? 'Chargement...'
    : nearbyMode
      ? `${resultCount} médecin${resultCount !== 1 ? 's' : ''} dans un rayon de 20 km${query.specialite ? ` · ${query.specialite}` : ''}`
      : `${resultCount} médecin${resultCount !== 1 ? 's' : ''} trouvé${resultCount !== 1 ? 's' : ''}${query.specialite ? ` · ${query.specialite}` : ''}${query.ville ? ` à ${query.ville}` : ''}`

  const geoLoading =
    geoState.status === 'loading' ||
    (nearbyMode && geoCoords === null && geoState.status !== 'error')

  return (
    <>
      <Header sticky={false} />

      {/* ── Sticky search + filter wrapper ── */}
      <div className="sticky top-0 z-40">

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
                disabled={nearbyMode}
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
      <div className="border-b border-[#c8dff5] bg-[#EBF4FF] shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 overflow-x-auto">
          <button
            type="button"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
          >
            <FilterIcon />
            Filtres
          </button>

          <div className="h-5 w-px shrink-0 bg-zinc-200" />

          {/* Près de moi button */}
          <button
            type="button"
            onClick={handleNearbyClick}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              nearbyMode
                ? 'border-[#1863A9] bg-[#1863A9] text-white'
                : 'border-zinc-300 text-zinc-600 hover:border-[#1863A9] hover:text-[#1863A9]'
            }`}
          >
            {geoLoading ? (
              <SpinnerIcon />
            ) : (
              <LocationIcon className={`h-3.5 w-3.5 ${nearbyMode ? 'text-white' : 'text-zinc-500'}`} />
            )}
            Près de moi
          </button>

          {geoState.status === 'error' && (
            <span className="shrink-0 text-xs text-red-500">{geoState.message}</span>
          )}

          <div className="h-5 w-px shrink-0 bg-zinc-200" />

          {/* Availability filter — hidden in nearby mode */}
          {!nearbyMode && (
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
          )}
        </div>
      </div>
      </div>{/* end sticky wrapper */}

      {/* ── Main layout ── */}
      <div className="min-h-screen bg-[#EBF4FF]">
      <div className="mx-auto flex max-w-6xl">

        {/* Left: results list */}
        <div className={`flex-1 min-w-0 px-4 py-5 ${mobileView === 'map' ? 'hidden lg:block' : 'block'}`}>
          <p className="mb-4 text-sm text-zinc-500">{resultLabel}</p>

          {isError && (
            <div className="rounded-xl border border-red-400/40 bg-red-900/30 px-4 py-3 text-sm text-red-300">
              {(error as Error).message}
            </div>
          )}

          {(isLoading || geoLoading) && <SkeletonCards />}

          {/* Nearby results */}
          {nearbyMode && !isLoading && !geoLoading && nearbyMedecins.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#DFEFFE]">
                <LocationIcon className="h-6 w-6 text-[#1863A9]" />
              </div>
              <p className="text-sm font-medium text-zinc-700">Aucun médecin dans un rayon de 20 km</p>
              <p className="mt-1 text-xs text-zinc-400">
                Essayez de rechercher par spécialité ou ville.
              </p>
            </div>
          )}

          {nearbyMode && !isLoading && !geoLoading && nearbyMedecins.length > 0 && (
            <div className="flex flex-col">
              {nearbyMedecins.map((r) => (
                <MedecinCardList
                  key={r.medecin.id}
                  medecin={r.medecin}
                  availableToday={false}
                  distanceKm={r.distanceKm}
                  onMouseEnter={() => setHoveredId(r.medecin.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              ))}
            </div>
          )}

          {/* Regular search results */}
          {!nearbyMode && !isLoading && searchResult.data && searchMedecins.length === 0 && (
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

          {!nearbyMode && !isLoading && searchMedecins.length > 0 && (
            <div className="flex flex-col">
              {searchMedecins.map((medecin) => (
                <MedecinCardList
                  key={medecin.id}
                  medecin={medecin}
                  availableToday={availableTodayIds.has(medecin.id)}
                  onMouseEnter={() => setHoveredId(medecin.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: sticky map — desktop side panel */}
        <div className="hidden lg:block w-[380px] shrink-0">
          <div className="sticky top-[97px] h-[calc(100vh-97px)] overflow-hidden rounded-tl-xl border-l border-zinc-200">
            <DoctorMap
              doctors={mapDoctors}
              hoveredId={hoveredId}
              center={geoCoords ?? undefined}
            />
            {mapDoctors.length === 0 && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#E8EFF6]/80 pointer-events-none">
                <div className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-500 shadow-md backdrop-blur-sm ring-1 ring-zinc-200">
                  Aucun médecin localisé
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>{/* end bg wrapper */}

      {/* ── Mobile map overlay (full-screen below sticky header) ── */}
      {mobileView === 'map' && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="relative h-full w-full overflow-hidden">
            <DoctorMap
              doctors={mapDoctors}
              hoveredId={hoveredId}
              center={geoCoords ?? undefined}
            />
            {mapDoctors.length === 0 && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#E8EFF6]/80 pointer-events-none">
                <div className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-zinc-500 shadow-md backdrop-blur-sm ring-1 ring-zinc-200">
                  Aucun médecin localisé
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile FAB: toggle list / map ── */}
      <button
        type="button"
        onClick={() => setMobileView(v => v === 'list' ? 'map' : 'list')}
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 lg:hidden flex items-center gap-2 rounded-full bg-[#007DFF] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-400/40 ring-1 ring-white/20 transition-all active:scale-95 hover:bg-[#00263C]"
      >
        {mobileView === 'list' ? (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Vue Carte
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Vue Liste
          </>
        )}
      </button>
    </>
  )
}
