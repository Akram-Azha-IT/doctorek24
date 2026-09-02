'use client'

import { useMemo } from 'react'
import { MedecinCardList } from '@/features/annuaire/components/MedecinCardList'
import { useNotesMedecins } from '@/features/avis/hooks'
import LogoLoader from '@/components/LogoLoader'
import { ResilientState } from '@/components/ResilientState'
import type { BookingSlot, MedecinNearbyResult, MedecinProfile } from '@/lib/types'
import type { DisponibiliteFilter } from '@/lib/disponibilite'
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
        <ResilientState
          surface="plain"
          variant="empty"
          title="Aucun médecin à proximité"
          description="Aucun praticien n'est actuellement disponible dans un rayon de 20 km. La recherche par ville reste accessible."
          primaryAction={{ label: 'Rechercher par ville', href: '/recherche' }}
        />
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
        <ResilientState
          surface="plain"
          variant="empty"
          title="Aucun médecin trouvé"
          description={
            filter !== 'all' || exactDate
              ? 'Aucun praticien n’est disponible avec ces critères. Vos autres options de recherche restent accessibles.'
              : 'Aucun praticien n’est enregistré dans cette zone pour le moment.'
          }
          primaryAction={
            filter !== 'all' || exactDate
              ? {
                  label: 'Toutes les dates',
                  onClick: () => {
                    if (onClearAvailability) onClearAvailability()
                    else onFilterChange?.('all')
                  },
                }
              : undefined
          }
          secondaryAction={{ label: 'Nouvelle recherche', href: '/recherche' }}
        />
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
