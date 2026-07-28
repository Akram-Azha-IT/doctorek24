'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

// Fallback if API unavailable
const FALLBACK_VILLES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir',
  'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Safi', 'Mohammedia',
  'El Jadida', 'Béni Mellal', 'Nador', 'Laâyoune', 'Settat',
  'Salé', 'Dakhla', 'Essaouira', 'Khouribga', 'Ouarzazate',
  'Al Hoceïma', 'Larache', 'Taza',
]

// Module-level cache — fetched once, shared across all instances
let _cities: string[] | null = null
let _promise: Promise<string[]> | null = null

async function fetchVillesMaroc(): Promise<string[]> {
  if (_cities) return _cities
  if (_promise) return _promise
  _promise = fetch('https://countriesnow.space/api/v0.1/countries/cities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ country: 'Morocco' }),
    signal: AbortSignal.timeout(6000),
  })
    .then(r => r.json())
    .then(data => {
      const list: string[] = Array.isArray(data?.data) ? data.data : []
      // Comparer les villes entre elles selon la locale française ; le second argument
      // de localeCompare est la chaîne à comparer, pas la locale (3e argument).
      _cities = list.length > 0 ? [...list].sort((a, b) => a.localeCompare(b, 'fr')) : FALLBACK_VILLES
      return _cities
    })
    .catch(() => {
      _cities = FALLBACK_VILLES
      return _cities
    })
  return _promise
}

interface CityInputProps {
  value: string
  onChange: (v: string) => void
  onNearby?: () => void
  nearbyLoading?: boolean
  placeholder?: string
  inputClassName?: string
  disabled?: boolean
  'aria-label'?: string
}

/** Identifiant reliant l'input a sa liste (aria-controls / aria-activedescendant). */
const LISTBOX_ID = 'city-input-listbox'

export function CityInput({
  value,
  onChange,
  onNearby,
  nearbyLoading,
  placeholder = 'Ville (ex: Casablanca)',
  inputClassName = '',
  disabled,
  'aria-label': ariaLabel = 'Ville ou localisation',
}: CityInputProps) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(-1)
  const [villes, setVilles] = useState<string[]>(_cities ?? FALLBACK_VILLES)
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const updateRect = useCallback(() => {
    if (containerRef.current) {
      const r = containerRef.current.getBoundingClientRect()
      setDropdownRect({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: r.width })
    }
  }, [])

  // Load cities from API on first open
  useEffect(() => {
    if (!_cities) {
      fetchVillesMaroc().then(cities => setVilles(cities))
    }
  }, [])

  const filtered = value.trim().length > 0
    ? villes.filter(v => v.toLowerCase().includes(value.toLowerCase().trim()))
    : villes

  const options: { type: 'nearby' | 'city'; label: string }[] = [
    ...(onNearby ? [{ type: 'nearby' as const, label: 'Près de moi' }] : []),
    ...filtered.map(c => ({ type: 'city' as const, label: c })),
  ]

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false); setFocused(-1); return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setFocused(f => Math.min(f + 1, options.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocused(f => Math.max(f - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      if (open && focused >= 0 && options[focused]) {
        // Select focused dropdown item
        e.preventDefault()
        selectOption(options[focused])
      } else {
        // Nothing focused or dropdown closed — close dropdown, let form submit
        setOpen(false)
        setFocused(-1)
        // Don't preventDefault → form's onSubmit fires naturally
      }
    }
  }

  function selectOption(opt: { type: 'nearby' | 'city'; label: string }) {
    if (opt.type === 'nearby') {
      onNearby?.()
    } else {
      onChange(opt.label)
    }
    setOpen(false)
    setFocused(-1)
    inputRef.current?.blur()
  }

  // Scroll focused item into view
  useEffect(() => {
    if (focused >= 0 && listRef.current) {
      const item = listRef.current.children[focused] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [focused])

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setFocused(-1); updateRect() }}
        onFocus={() => { setOpen(true); setFocused(-1); updateRect() }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={LISTBOX_ID}
        aria-activedescendant={focused >= 0 ? `${LISTBOX_ID}-opt-${focused}` : undefined}
        autoComplete="off"
        className={`w-full bg-transparent ${inputClassName}`}
      />

      {open && options.length > 0 && dropdownRect && typeof document !== 'undefined' && createPortal(
        <ul
          ref={listRef}
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Villes disponibles"
          style={{
            position: 'fixed',
            top: dropdownRect.top - window.scrollY,
            left: dropdownRect.left,
            width: Math.max(dropdownRect.width, 220),
            overscrollBehavior: 'contain',
            zIndex: 9999,
          }}
          className="max-h-60 overflow-y-auto overscroll-contain rounded-xl bg-white shadow-xl border border-zinc-100 py-1"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {options.map((opt, i) => (
            <li
              key={opt.label}
              id={`${LISTBOX_ID}-opt-${i}`}
              role="option"
              aria-selected={i === focused}
              onMouseDown={(e) => { e.preventDefault(); selectOption(opt) }}
              onMouseEnter={() => setFocused(i)}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                i === focused ? 'bg-[#EBF4FF] text-[#007DFF]' : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {opt.type === 'nearby' ? (
                <>
                  {nearbyLoading ? (
                    <svg className="h-4 w-4 shrink-0 text-[#007DFF] animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 shrink-0 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                    </svg>
                  )}
                  <span className="font-semibold text-[#007DFF]">Près de moi</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                  {opt.label}
                </>
              )}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  )
}
