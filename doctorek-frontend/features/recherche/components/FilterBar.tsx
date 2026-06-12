import type { DisponibiliteFilter } from '@/lib/disponibilite'
import { LocationIcon, SpinnerIcon } from './icons'

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
      <div className="mx-auto max-w-6xl px-4 py-2.5">

        {/* ── Mobile: two rows, no scrolling ── */}
        <div className="flex flex-col gap-2 sm:hidden">

          {/* Row 1 — Nearby toggle (full width) */}
          <button
            type="button"
            onClick={onNearbyClick}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1863A9] ${
              nearbyMode
                ? 'border-[#1863A9] bg-[#1863A9] text-white'
                : 'border-zinc-300 bg-white text-zinc-600 hover:border-[#1863A9] hover:text-[#1863A9]'
            }`}
          >
            {geoLoading ? (
              <SpinnerIcon />
            ) : (
              <LocationIcon className={`h-4 w-4 ${nearbyMode ? 'text-white' : 'text-zinc-500'}`} aria-hidden="true" />
            )}
            {nearbyMode ? 'Médecins près de moi ✓' : 'Rechercher près de moi'}
          </button>

          {geoState.status === 'error' && (
            <p className="text-xs text-red-500 text-center">{geoState.message}</p>
          )}

          {/* Row 2 — Date filter (full width, 3 equal buttons) */}
          {!nearbyMode && (
            <div
              className="grid grid-cols-3 rounded-xl border border-zinc-200 bg-white p-0.5"
              role="group"
              aria-label="Filtrer par disponibilité"
            >
              {DISPO_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => onFilterChange(f.value)}
                  aria-pressed={filter === f.value}
                  className={`rounded-lg py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1863A9] ${
                    filter === f.value
                      ? 'bg-[#1863A9] text-white shadow-sm'
                      : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop: single row (unchanged) ── */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            type="button"
            onClick={onNearbyClick}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1863A9] ${
              nearbyMode
                ? 'border-[#1863A9] bg-[#1863A9] text-white'
                : 'border-zinc-300 text-zinc-600 hover:border-[#1863A9] hover:text-[#1863A9]'
            }`}
          >
            {geoLoading ? (
              <SpinnerIcon />
            ) : (
              <LocationIcon className={`h-3.5 w-3.5 ${nearbyMode ? 'text-white' : 'text-zinc-500'}`} aria-hidden="true" />
            )}
            Près de moi
          </button>

          {geoState.status === 'error' && (
            <span className="shrink-0 text-xs text-red-500">{geoState.message}</span>
          )}

          {!nearbyMode && (
            <>
              <div className="h-5 w-px shrink-0 bg-zinc-200" aria-hidden="true" />
              <div
                className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-0.5"
                role="group"
                aria-label="Filtrer par disponibilité"
              >
                {DISPO_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => onFilterChange(f.value)}
                    aria-pressed={filter === f.value}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1863A9] ${
                      filter === f.value
                        ? 'bg-[#1863A9] text-white shadow-sm ring-2 ring-[#1863A9]/20'
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
