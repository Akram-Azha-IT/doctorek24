'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowUpDown, Check, X } from 'lucide-react'

export type SortKey = 'pertinence' | 'nom' | 'distance'

export interface ActiveFilter {
  key: string
  label: string
  onRemove: () => void
}

interface ResultsToolbarProps {
  total: number
  loading: boolean
  nearbyMode: boolean
  sort: SortKey
  onSortChange: (s: SortKey) => void
  activeFilters: ActiveFilter[]
}

/** Barre de résultats façon Booking : compteur fort, filtres actifs retirables, tri. */
export function ResultsToolbar({
  total,
  loading,
  nearbyMode,
  sort,
  onSortChange,
  activeFilters,
}: ResultsToolbarProps) {
  const options: { key: SortKey; label: string }[] = [
    { key: 'pertinence', label: 'Pertinence' },
    { key: 'nom', label: 'Nom (A → Z)' },
    ...(nearbyMode ? [{ key: 'distance' as SortKey, label: 'Distance' }] : []),
  ]
  const current = options.find((o) => o.key === sort) ?? options[0]

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-bold text-[#010C2D] sm:text-base" aria-live="polite">
          {loading ? (
            <span className="inline-block h-4 w-32 animate-pulse rounded bg-zinc-200 align-middle" />
          ) : (
            <>
              {total.toLocaleString('fr-FR')} médecin{total !== 1 ? 's' : ''}
              <span className="font-medium text-zinc-400"> trouvé{total !== 1 ? 's' : ''}</span>
            </>
          )}
        </p>

        {/* Tri */}
        <div className="relative shrink-0" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-[#010C2D] transition-colors hover:border-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/40 cursor-pointer"
          >
            <ArrowUpDown className="h-4 w-4 text-[#007DFF]" />
            <span className="hidden sm:inline text-zinc-400 font-medium">Trier :</span>
            {current.label}
          </button>

          {open && (
            <ul
              role="listbox"
              className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-100 bg-white py-1 shadow-lg"
            >
              {options.map((o) => (
                <li key={o.key}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.key === sort}
                    onClick={() => { onSortChange(o.key); setOpen(false) }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-[#F1F4F7] cursor-pointer ${
                      o.key === sort ? 'font-semibold text-[#007DFF]' : 'text-[#465058]'
                    }`}
                  >
                    {o.label}
                    {o.key === sort && <Check className="h-4 w-4" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Filtres actifs */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={f.onRemove}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#B6DAF7] bg-[#EBF4FF] px-3 py-1 text-[13px] font-medium text-[#1863A9] transition-colors hover:bg-[#DFEFFE] cursor-pointer"
            >
              {f.label}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
