'use client'

import { useMemo } from 'react'
import { MedecinCardList } from '@/features/annuaire/components/MedecinCardList'
import { useNotesMedecins } from '@/features/avis/hooks'
import LogoLoader from '@/components/LogoLoader'
import type { BookingSlot, MedecinNearbyResult, MedecinProfile } from '@/lib/types'
import type { DisponibiliteFilter } from '@/lib/disponibilite'
import { LocationIcon } from './icons'
import { Pagination } from './Pagination'
import { ErrorState } from '@/components/ErrorState'
import { ResultsToolbar, type ActiveFilter } from './ResultsToolbar'

interface ResultsListProps {
  nearbyMode: boolean
  isLoading: boolean
  geoLoading: boolean
  isError: boolean
  error: unknown
  onRetry?: () => void
  isRetrying?: boolean
  total: number
  activeFilters: ActiveFilter[]
  filter: DisponibiliteFilter
  exactDate?: string | null
  ville?: string
  specialite?: string
  nearbyMedecins: MedecinNearbyResult[]
  pagedNearby: MedecinNearbyResult[]
  searchContent: MedecinProfile[]
  hasSearchData: boolean
  page: number
  totalPages: number
  onPage: (p: number) => void
  onHover: (id: string | null) => void
  onBookSlot: (slot: BookingSlot) => void
  onFilterChange?: (f: DisponibiliteFilter) => void
  onClearAvailability?: () => void
  mobileView: 'list' | 'map'
}

export function ResultsList({
  nearbyMode,
  isLoading,
  geoLoading,
  isError,
  error,
  onRetry,
  isRetrying,
  total,
  activeFilters,
  filter,
  exactDate,
  ville,
  specialite,
  nearbyMedecins,
  pagedNearby,
  searchContent,
  hasSearchData,
  page,
  totalPages,
  onPage,
  onHover,
  onBookSlot,
  onFilterChange,
  onClearAvailability,
  mobileView,
}: ResultsListProps) {
  const loading = isLoading || geoLoading

  // Les notes des cartes visibles en une requête : une par carte suivrait la pagination.
  const idsAffiches = useMemo(
    () => (nearbyMode ? pagedNearby.map((r) => r.medecin.id) : searchContent.map((m) => m.id)),
    [nearbyMode, pagedNearby, searchContent],
  )
  const { data: notes } = useNotesMedecins(idsAffiches)

  return (
    <div className={`min-w-0 flex-1 px-4 py-6 lg:px-0 ${mobileView === 'map' ? 'hidden lg:block' : 'block'}`}>
      {/* Barre de résultats (compteur + tri + filtres actifs) — cachée en erreur */}
      {!isError && (
        <ResultsToolbar
          total={total}
          loading={loading}
          nearbyMode={nearbyMode}
          ville={ville}
          specialite={specialite}
          activeFilters={activeFilters}
        />
      )}

      {isError && <ErrorState error={error} onRetry={onRetry} isRetrying={isRetrying} />}

      {loading && (
        <div className="flex justify-center py-16">
          <LogoLoader width={120} label="Recherche en cours…" />
        </div>
      )}

      {nearbyMode && !loading && !isError && nearbyMedecins.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="relative mb-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#EBF4FF] to-[#DFEFFE] flex items-center justify-center">
              <LocationIcon className="h-10 w-10 text-[#007DFF]/40" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[#FFF3CD] flex items-center justify-center shadow-sm">
              <svg className="h-4 w-4 text-[#856404]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
              </svg>
            </div>
          </div>
          <h3 className="text-base font-bold text-[#010C2D] mb-1">Aucun médecin à proximité</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-xs leading-relaxed">
            Aucun praticien dans un rayon de 20 km. Essayez une recherche par ville.
          </p>
          <a
            href="/recherche"
            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:border-[#007DFF] hover:text-[#007DFF] transition-colors"
          >
            Rechercher par ville
          </a>
        </div>
      )}

      {nearbyMode && !loading && nearbyMedecins.length > 0 && (
        <>
          <div className="flex flex-col">
            {pagedNearby.map((r) => (
              <MedecinCardList
                key={`${r.medecin.id}:${exactDate ?? 'default'}`}
                medecin={r.medecin}
                note={notes?.get(r.medecin.id)}
                distanceKm={r.distanceKm}
                onMouseEnter={() => onHover(r.medecin.id)}
                onMouseLeave={() => onHover(null)}
                onBookSlot={onBookSlot}
                searchDate={exactDate}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={onPage} />
        </>
      )}

      {!nearbyMode && !loading && hasSearchData && searchContent.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          {/* Illustration */}
          <div className="relative mb-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#EBF4FF] to-[#DFEFFE] flex items-center justify-center shadow-inner">
              <svg className="h-10 w-10 text-[#007DFF]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[#FFDEDE] flex items-center justify-center shadow-sm">
              <svg className="h-4 w-4 text-[#E01E5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
          </div>

          <h3 className="text-base font-bold text-[#010C2D] mb-1">
            Aucun médecin trouvé
          </h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-xs leading-relaxed">
            {filter !== 'all' || exactDate
              ? 'Aucun praticien disponible avec ce filtre. Élargissez la recherche.'
              : 'Aucun praticien enregistré dans cette zone pour le moment.'}
          </p>

          {/* Action suggestions */}
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
            {(filter !== 'all' || exactDate) && (
              <button
                type="button"
                onClick={() => {
                  if (onClearAvailability) onClearAvailability()
                  else onFilterChange?.('all')
                }}
                className="cursor-pointer flex-1 rounded-xl bg-[#007DFF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00263C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
              >
                Toutes les dates
              </button>
            )}
            <a
              href="/recherche"
              className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:border-[#007DFF] hover:text-[#007DFF] transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
            >
              Nouvelle recherche
            </a>
          </div>
        </div>
      )}

      {!nearbyMode && !loading && searchContent.length > 0 && (
        <>
          <div className="flex flex-col">
            {searchContent.map((medecin) => (
              <MedecinCardList
                key={`${medecin.id}:${exactDate ?? 'default'}`}
                medecin={medecin}
                note={notes?.get(medecin.id)}
                onMouseEnter={() => onHover(medecin.id)}
                onMouseLeave={() => onHover(null)}
                onBookSlot={onBookSlot}
                searchDate={exactDate}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={onPage} />
        </>
      )}
    </div>
  )
}
