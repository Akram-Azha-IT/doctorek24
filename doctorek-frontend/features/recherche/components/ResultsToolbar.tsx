'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpDown, Check, ChevronDown, ShieldCheck, X } from 'lucide-react'

export type SortKey = 'pertinence' | 'nom' | 'distance'

export interface ActiveFilter {
  key: string
  label: string
  onRemove: () => void
}

interface SortControlProps {
  nearbyMode: boolean
  sort: SortKey
  onSortChange: (sort: SortKey) => void
}

export function SortControl({ nearbyMode, sort, onSortChange }: SortControlProps) {
  const options: { key: SortKey; label: string }[] = [
    { key: 'pertinence', label: 'Pertinence' },
    { key: 'nom', label: 'Nom (A – Z)' },
    ...(nearbyMode ? [{ key: 'distance' as SortKey, label: 'Distance' }] : []),
  ]
  const current = options.find((option) => option.key === sort) ?? options[0]
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [])

  return (
    <div className="relative ml-auto shrink-0" ref={ref}>
      <div className="flex items-center gap-2">
        <span className="hidden text-sm font-medium text-[#7A8795] lg:inline">Trier par</span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] border border-[#DCE5EE] bg-white px-3 text-xs font-semibold text-[#243547] transition-colors hover:border-[#9CCEFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/35 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm"
        >
          <ArrowUpDown className="h-4 w-4 text-[#007DFF] lg:hidden" aria-hidden="true" />
          {current.label}
          <ChevronDown className={`h-4 w-4 text-[#607080] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <ul role="listbox" className="absolute right-0 z-[90] mt-2 w-52 overflow-hidden rounded-xl border border-[#DCE5EE] bg-white py-1 shadow-[0_16px_40px_rgba(1,38,81,0.14)]">
          {options.map((option) => (
            <li key={option.key}>
              <button
                type="button"
                role="option"
                aria-selected={option.key === sort}
                onClick={() => {
                  onSortChange(option.key)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-[#F1F6FD] ${
                  option.key === sort ? 'font-semibold text-[#007DFF]' : 'text-[#465058]'
                }`}
              >
                {option.label}
                {option.key === sort && <Check className="h-4 w-4" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface ResultsToolbarProps {
  total: number
  loading: boolean
  nearbyMode: boolean
  ville?: string
  specialite?: string
  activeFilters: ActiveFilter[]
}

export function ResultsToolbar({
  total,
  loading,
  nearbyMode,
  ville,
  specialite,
  activeFilters,
}: ResultsToolbarProps) {
  const context = nearbyMode ? 'près de vous' : ville ? `à ${ville}` : ''

  return (
    <div className="mb-5 flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-[-0.025em] text-[#010C2D] sm:text-[22px]" aria-live="polite">
            {loading ? (
              <span className="inline-block h-6 w-48 animate-pulse rounded-md bg-zinc-200 align-middle" />
            ) : (
              <>
                {total.toLocaleString('fr-FR')} médecin{total !== 1 ? 's' : ''}{' '}
                {context && <span className="text-[#007DFF]">{context}</span>}
              </>
            )}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[#607080]">
            {specialite
              ? `Profils correspondant à « ${specialite} », avec leurs prochains créneaux.`
              : 'Comparez les profils et choisissez un créneau adapté.'}
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-[#607080]">
          <ShieldCheck className="h-4 w-4 text-[#007DFF]" aria-hidden="true" />
          Médecins vérifiés
        </span>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={filter.onRemove}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#B6DAF7] bg-[#EBF4FF] px-3 py-1 text-[13px] font-medium text-[#1863A9] transition-colors hover:bg-[#DFEFFE]"
            >
              {filter.label}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
