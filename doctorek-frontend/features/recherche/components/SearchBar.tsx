'use client'

import type { UseFormRegister } from 'react-hook-form'
import type { SearchFormValues } from '@/features/annuaire/schemas'
import { SearchIcon } from './icons'
import { CityInput } from '@/components/CityInput'

interface SearchBarProps {
  register: UseFormRegister<SearchFormValues>
  villeValue: string
  onVilleChange: (v: string) => void
  onNearbyClick: () => void
  nearbyLoading?: boolean
  nearbyMode: boolean
  onSearch?: () => void
}

export function SearchBar({
  register,
  villeValue,
  onVilleChange,
  onNearbyClick,
  nearbyLoading,
  nearbyMode,
  onSearch,
}: SearchBarProps) {
  return (
    <div className="relative z-50 bg-[#064178] px-3 py-3 md:px-4 md:py-4 shadow-lg">
      <div className="mx-auto max-w-6xl">
        <div
          role="search"
          aria-label="Rechercher un médecin"
          className="flex items-center gap-0 rounded-xl bg-white shadow-md ring-1 ring-zinc-200 focus-within:ring-2 focus-within:ring-[#1863A9] transition-shadow"
        >
          <div className="flex flex-1 items-center gap-2 px-3 py-2.5 md:px-4 md:py-3">
            <SearchIcon aria-hidden="true" />
            <input
              aria-label="Spécialité ou nom du médecin"
              placeholder="Spécialité ou médecin…"
              className="w-full bg-transparent text-[13px] md:text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              {...register('specialite')}
            />
          </div>

          <div className="h-8 w-px bg-zinc-200" aria-hidden="true" />

          <div className={`flex flex-1 items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 ${nearbyMode ? 'opacity-50' : ''}`}>
            <svg className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
            </svg>
            <CityInput
              value={villeValue}
              onChange={onVilleChange}
              onNearby={nearbyMode ? undefined : onNearbyClick}
              nearbyLoading={nearbyLoading}
              placeholder="Ville…"
              inputClassName="text-[13px] md:text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
              disabled={nearbyMode}
            />
          </div>

          <button
            type="button"
            onClick={onSearch}
            aria-label="Lancer la recherche"
            className="flex items-center gap-1.5 rounded-r-xl bg-[#1863A9] px-4 py-3 md:px-6 md:py-3.5 text-[13px] md:text-sm font-semibold text-white transition-colors hover:bg-[#0C4A83] active:bg-[#064178] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1863A9]"
          >
            <SearchIcon className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
            <span className="hidden xs:inline sm:inline">Rechercher</span>
          </button>
        </div>
      </div>
    </div>
  )
}
