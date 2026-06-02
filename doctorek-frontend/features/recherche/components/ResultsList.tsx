'use client'

import { MedecinCardList } from '@/features/annuaire/components/MedecinCardList'
import type { BookingSlot } from '@/lib/types'
import { SearchIcon, LocationIcon } from './icons'
import { Pagination } from './Pagination'

function SkeletonCards() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-zinc-100" />
      ))}
    </div>
  )
}

interface NearbyResult {
  medecin: { id: string; latitude?: number | null; longitude?: number | null; [key: string]: unknown }
  distanceKm: number
}

interface ResultsListProps {
  nearbyMode: boolean
  isLoading: boolean
  geoLoading: boolean
  isError: boolean
  error: unknown
  resultLabel: string
  filter: string
  nearbyMedecins: NearbyResult[]
  pagedNearby: NearbyResult[]
  searchContent: { id: string; [key: string]: unknown }[]
  availableTodayIds: Set<string>
  hasSearchData: boolean
  page: number
  totalPages: number
  onPage: (p: number) => void
  onHover: (id: string | null) => void
  onBookSlot: (slot: BookingSlot) => void
  mobileView: 'list' | 'map'
}

export function ResultsList({
  nearbyMode,
  isLoading,
  geoLoading,
  isError,
  error,
  resultLabel,
  filter,
  nearbyMedecins,
  pagedNearby,
  searchContent,
  availableTodayIds,
  hasSearchData,
  page,
  totalPages,
  onPage,
  onHover,
  onBookSlot,
  mobileView,
}: ResultsListProps) {
  return (
    <div className={`flex-1 min-w-0 px-4 py-5 ${mobileView === 'map' ? 'hidden lg:block' : 'block'}`}>
      <p className="mb-4 text-sm text-zinc-500">{resultLabel}</p>

      {isError && (
        <div className="rounded-xl border border-red-400/40 bg-red-900/30 px-4 py-3 text-sm text-red-300">
          {(error as Error).message}
        </div>
      )}

      {(isLoading || geoLoading) && <SkeletonCards />}

      {nearbyMode && !isLoading && !geoLoading && nearbyMedecins.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#DFEFFE]">
            <LocationIcon className="h-6 w-6 text-[#1863A9]" />
          </div>
          <p className="text-sm font-medium text-zinc-700">Aucun médecin dans un rayon de 20 km</p>
          <p className="mt-1 text-xs text-zinc-400">Essayez de rechercher par spécialité ou ville.</p>
        </div>
      )}

      {nearbyMode && !isLoading && !geoLoading && nearbyMedecins.length > 0 && (
        <>
          <div className="flex flex-col">
            {pagedNearby.map((r) => (
              <MedecinCardList
                key={r.medecin.id}
                medecin={r.medecin as Parameters<typeof MedecinCardList>[0]['medecin']}
                availableToday={false}
                distanceKm={r.distanceKm}
                onMouseEnter={() => onHover(r.medecin.id)}
                onMouseLeave={() => onHover(null)}
                onBookSlot={onBookSlot}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={onPage} />
        </>
      )}

      {!nearbyMode && !isLoading && hasSearchData && searchContent.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#DFEFFE]">
            <SearchIcon className="h-6 w-6 text-[#1863A9]" />
          </div>
          <p className="text-sm font-medium text-zinc-700">Aucun médecin trouvé</p>
          <p className="mt-1 text-xs text-zinc-400">
            {filter !== 'all'
              ? 'Essayez "Toutes dates" pour élargir la recherche.'
              : 'Essayez une autre spécialité ou ville.'}
          </p>
        </div>
      )}

      {!nearbyMode && !isLoading && searchContent.length > 0 && (
        <>
          <div className="flex flex-col">
            {searchContent.map((medecin) => (
              <MedecinCardList
                key={medecin.id}
                medecin={medecin as Parameters<typeof MedecinCardList>[0]['medecin']}
                availableToday={availableTodayIds.has(medecin.id)}
                onMouseEnter={() => onHover(medecin.id)}
                onMouseLeave={() => onHover(null)}
                onBookSlot={onBookSlot}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={onPage} />
        </>
      )}
    </div>
  )
}
