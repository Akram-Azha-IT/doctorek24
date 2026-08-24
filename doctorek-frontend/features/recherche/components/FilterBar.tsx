import { CalendarDays } from 'lucide-react'
import type { DisponibiliteFilter } from '@/lib/disponibilite'
import { LocationIcon, SpinnerIcon } from './icons'
import type { RechercheAvailabilityValue } from './RechercheDatePicker'
import { SortControl, type SortKey } from './ResultsToolbar'

interface GeoState {
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

interface FilterBarProps {
  nearbyMode: boolean
  geoLoading: boolean
  geoState: GeoState
  filter: DisponibiliteFilter
  date: string | null
  sort: SortKey
  onNearbyClick: () => void
  onAvailabilityChange: (value: RechercheAvailabilityValue) => void
  onSortChange: (sort: SortKey) => void
}

function quickFilterClass(active: boolean) {
  return `flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-[10px] border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/35 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm ${
    active
      ? 'border-[#9CCEFF] bg-[#EBF4FF] text-[#007DFF] shadow-sm'
      : 'border-[#DCE5EE] bg-white text-[#465058] hover:border-[#9CCEFF] hover:text-[#007DFF]'
  }`
}

export function FilterBar({
  nearbyMode,
  geoLoading,
  geoState,
  filter,
  date,
  sort,
  onNearbyClick,
  onAvailabilityChange,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="border-b border-[#E3EAF1] bg-[#F8FAFC]">
      <div className="mx-auto flex max-w-6xl flex-row items-center gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-4 sm:py-3">
        {!nearbyMode && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onAvailabilityChange({ filter: 'today', date: null })}
              aria-pressed={!date && filter === 'today'}
              className={quickFilterClass(!date && filter === 'today')}
            >
              <CalendarDays className="h-[18px] w-[18px]" aria-hidden="true" />
              Aujourd’hui
            </button>
            <button
              type="button"
              onClick={() => onAvailabilityChange({ filter: 'week', date: null })}
              aria-pressed={!date && filter === 'week'}
              className={quickFilterClass(!date && filter === 'week')}
            >
              Cette semaine
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onNearbyClick}
          className={`flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-[10px] border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/35 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm ${
            nearbyMode
              ? 'border-[#007DFF] bg-[#007DFF] text-white shadow-sm'
              : 'border-[#DCE5EE] bg-white text-[#465058] hover:border-[#9CCEFF] hover:text-[#007DFF]'
          }`}
        >
          {geoLoading ? (
            <SpinnerIcon inverse={nearbyMode} />
          ) : (
            <LocationIcon className={`h-4 w-4 ${nearbyMode ? 'text-white' : 'text-[#607080]'}`} aria-hidden="true" />
          )}
          {nearbyMode ? 'Près de moi · actif' : 'Près de moi'}
        </button>

        {geoState.status === 'error' && (
          <span className="text-center text-xs font-medium text-[#E01E5A] sm:text-left">{geoState.message}</span>
        )}

        <SortControl nearbyMode={nearbyMode} sort={sort} onSortChange={onSortChange} />
      </div>
    </div>
  )
}
