import type { DisponibiliteFilter } from '@/lib/disponibilite'
import { FilterIcon, LocationIcon, SpinnerIcon } from './icons'

const DISPO_FILTERS: ReadonlyArray<{ value: DisponibiliteFilter; label: string }> = [
  { value: 'all', label: 'Toutes dates' },
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
]

interface GeoState {
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
}

interface FilterBarProps {
  nearbyMode: boolean
  geoLoading: boolean
  geoState: GeoState
  filter: DisponibiliteFilter
  onNearbyClick: () => void
  onFilterChange: (f: DisponibiliteFilter) => void
}

export function FilterBar({ nearbyMode, geoLoading, geoState, filter, onNearbyClick, onFilterChange }: FilterBarProps) {
  return (
    <div className="border-b border-[#c8dff5] bg-[#EBF4FF] shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-4 py-2.5">
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
        >
          <FilterIcon />
          Filtres
        </button>

        <div className="h-5 w-px shrink-0 bg-zinc-200" />

        <button
          type="button"
          onClick={onNearbyClick}
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

        {!nearbyMode && (
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-0.5">
            {DISPO_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => onFilterChange(f.value)}
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
  )
}
