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
    <div className="relative z-50 bg-gradient-to-r from-[#00335F] via-[#064178] to-[#007DFF] px-3 py-3 md:px-4 md:py-3.5 shadow-lg">
      <div className="mx-auto max-w-6xl">
        <div
          role="search"
          aria-label="Rechercher un médecin"
          className="flex items-stretch gap-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-[#3DA8FF] transition-shadow"
        >
          {/* Spécialité / nom */}
          <div className="flex flex-1 items-center gap-2.5 px-3.5 py-3 md:px-5 md:py-3.5">
            <SearchIcon aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <label className="hidden md:block text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                Spécialité ou médecin
              </label>
              <input
                aria-label="Spécialité ou nom du médecin"
                placeholder="Dentiste, cardiologue, Dr. Alami…"
                className="w-full bg-transparent text-sm font-medium text-zinc-900 outline-none placeholder:font-normal placeholder:text-zinc-400"
                {...register('specialite')}
              />
            </div>
          </div>

          <div className="my-2 w-px bg-zinc-200" aria-hidden="true" />

          {/* Ville */}
          <div className={`flex flex-1 items-center gap-2.5 px-3.5 py-3 md:px-5 md:py-3.5 ${nearbyMode ? 'opacity-50' : ''}`}>
            <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
            </svg>
            <div className="min-w-0 flex-1">
              <label className="hidden md:block text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                Ville
              </label>
              <CityInput
                value={villeValue}
                onChange={onVilleChange}
                onNearby={nearbyMode ? undefined : onNearbyClick}
                nearbyLoading={nearbyLoading}
                placeholder="Casablanca, Rabat…"
                inputClassName="w-full text-sm font-medium text-zinc-900 placeholder:font-normal placeholder:text-zinc-400 outline-none"
                disabled={nearbyMode}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onSearch}
            aria-label="Lancer la recherche"
            className="flex items-center gap-2 bg-[#007DFF] px-4 md:px-7 text-sm font-bold text-white transition-colors hover:bg-[#00263C] active:bg-[#064178] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <SearchIcon className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
            <span className="hidden sm:inline">Rechercher</span>
          </button>
        </div>
      </div>
    </div>
  )
}
