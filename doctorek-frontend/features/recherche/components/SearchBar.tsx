'use client'

import type { UseFormRegister } from 'react-hook-form'
import type { SearchFormValues } from '@/features/annuaire/schemas'
import { SearchIcon } from './icons'
import { CityInput } from '@/components/CityInput'
import type { DisponibiliteFilter } from '@/lib/disponibilite'
import { RechercheDatePicker, type RechercheAvailabilityValue } from './RechercheDatePicker'

interface SearchBarProps {
  register: UseFormRegister<SearchFormValues>
  villeValue: string
  onVilleChange: (v: string) => void
  onNearbyClick: () => void
  nearbyLoading?: boolean
  nearbyMode: boolean
  filter: DisponibiliteFilter
  date: string | null
  onAvailabilityChange: (value: RechercheAvailabilityValue) => void
  onSearch?: () => void
}

export function SearchBar({
  register,
  villeValue,
  onVilleChange,
  onNearbyClick,
  nearbyLoading,
  nearbyMode,
  filter,
  date,
  onAvailabilityChange,
  onSearch,
}: SearchBarProps) {
  return (
    <div className="relative z-50 border-b border-[#E3EAF1] bg-[#F6F9FC] px-3 py-2 md:bg-white md:px-4 md:py-4">
      <div className="mx-auto max-w-6xl">
        <div
          role="search"
          aria-label="Rechercher un médecin"
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_48px] overflow-visible rounded-[20px] bg-white p-1.5 shadow-[0_12px_32px_rgba(0,45,120,0.12)] ring-1 ring-[#DDEAF6] transition-shadow focus-within:ring-2 focus-within:ring-[#9CCEFF] md:flex md:rounded-2xl md:p-0 md:shadow-[0_7px_24px_rgba(1,38,81,0.08)] md:ring-[#DCE5EE]"
        >
          {/* Spécialité / nom */}
          <div className="col-span-3 flex min-h-[50px] items-center gap-2.5 border-b border-[#E8EEF5] px-3 md:col-auto md:min-h-[68px] md:flex-1 md:gap-3 md:border-b-0 md:px-5">
            <SearchIcon className="h-5 w-5 shrink-0 text-[#007DFF] md:h-4 md:w-4 md:text-[#8A98A8]" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <label className="hidden text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A98A8] md:block">
                Spécialité
              </label>
              <input
                aria-label="Spécialité ou nom du médecin"
                placeholder="Spécialité ou médecin"
                className="w-full bg-transparent text-[14px] text-[#243547] outline-none placeholder:font-normal placeholder:text-[#8996A6] md:mt-0.5 md:font-semibold md:placeholder:text-[#8A98A8]"
                {...register('specialite')}
              />
            </div>
          </div>

          {/* Ville */}
          <div className={`flex min-w-0 items-center gap-2 px-3 md:min-h-[68px] md:flex-1 md:gap-3 md:border-l md:border-[#E7EDF4] md:px-5 ${nearbyMode ? 'opacity-50' : ''}`}>
            <svg className="h-[18px] w-[18px] shrink-0 text-[#007DFF] md:h-4 md:w-4 md:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
            </svg>
            <div className="min-w-0 flex-1">
              <label className="hidden text-[10px] font-bold uppercase tracking-[0.08em] text-[#8A98A8] md:block">
                Ville ou quartier
              </label>
              <CityInput
                value={villeValue}
                onChange={onVilleChange}
                onNearby={nearbyMode ? undefined : onNearbyClick}
                nearbyLoading={nearbyLoading}
                placeholder="Ville"
                inputClassName="w-full text-[13px] text-[#243547] placeholder:font-normal placeholder:text-[#8996A6] outline-none md:mt-0.5 md:text-[14px] md:font-semibold md:placeholder:text-[#8A98A8]"
                disabled={nearbyMode}
              />
            </div>
          </div>

          <RechercheDatePicker
            variant="search"
            filter={filter}
            date={date}
            onChange={onAvailabilityChange}
          />

          <button
            type="button"
            onClick={onSearch}
            aria-label="Lancer la recherche"
            className="col-start-3 row-start-2 m-1 flex h-10 w-10 items-center justify-center self-center rounded-[13px] bg-[#00263C] text-white transition-colors hover:bg-[#001C2D] active:bg-[#001522] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007DFF] md:col-auto md:row-auto md:m-0 md:h-auto md:min-h-[68px] md:w-auto md:min-w-[170px] md:gap-2 md:rounded-l-none md:rounded-r-2xl md:bg-[#007DFF] md:px-7 md:text-sm md:font-bold md:shadow-[0_7px_18px_rgba(0,125,255,0.24)] md:hover:bg-[#00263C] md:active:bg-[#064178]"
          >
            <SearchIcon className="h-[18px] w-[18px] shrink-0 text-white md:h-4 md:w-4" aria-hidden="true" />
            <span className="hidden md:inline">Rechercher</span>
          </button>
        </div>
      </div>
    </div>
  )
}
