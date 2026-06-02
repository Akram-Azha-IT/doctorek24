import type { UseFormRegister } from 'react-hook-form'
import type { SearchFormValues } from '@/features/annuaire/schemas'
import { SearchIcon, LocationIcon } from './icons'

interface SearchBarProps {
  register: UseFormRegister<SearchFormValues>
  nearbyMode: boolean
}

export function SearchBar({ register, nearbyMode }: SearchBarProps) {
  return (
    <div className="bg-[#064178] px-4 py-4 shadow-lg">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-0 overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-zinc-200">
          <div className="flex flex-1 items-center gap-2.5 px-4 py-3">
            <SearchIcon />
            <input
              placeholder="Médecin, spécialité, clinique..."
              className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              {...register('specialite')}
            />
          </div>

          <div className="h-9 w-px bg-zinc-200" />

          <div className="flex flex-1 items-center gap-2.5 px-4 py-3">
            <LocationIcon />
            <input
              placeholder="Ville, code postal..."
              className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              {...register('ville')}
              disabled={nearbyMode}
            />
          </div>

          <button
            type="button"
            className="flex items-center gap-2 rounded-r-xl bg-[#1863A9] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#0C4A83] active:bg-[#064178]"
          >
            <SearchIcon className="h-4 w-4 shrink-0 text-white" />
            <span className="hidden sm:inline">Rechercher</span>
          </button>
        </div>
      </div>
    </div>
  )
}
