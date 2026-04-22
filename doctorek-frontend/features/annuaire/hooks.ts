import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/lib/hooks'
import { getMedecin, searchMedecins, searchMedecinsDisponibles } from './api'
import type { DisponibiliteFilter } from '@/lib/disponibilite'

export function useSearchMedecins(specialite: string, ville: string) {
  const debouncedSpecialite = useDebounce(specialite.trim(), 400)
  const debouncedVille = useDebounce(ville.trim(), 400)

  return useQuery({
    queryKey: ['medecins', 'search', debouncedSpecialite, debouncedVille],
    queryFn: () => searchMedecins(debouncedSpecialite, debouncedVille),
    staleTime: 60 * 1000,
  })
}

export function useSearchMedecinsDisponibles(
  specialite: string,
  ville: string,
  filter: DisponibiliteFilter,
) {
  const debouncedSpecialite = useDebounce(specialite.trim(), 400)
  const debouncedVille = useDebounce(ville.trim(), 400)

  return useQuery({
    queryKey: [
      'medecins',
      'search',
      'dispo',
      debouncedSpecialite,
      debouncedVille,
      filter,
    ],
    queryFn: () =>
      searchMedecinsDisponibles(debouncedSpecialite, debouncedVille, filter),
    staleTime: 60 * 1000,
  })
}

export function useMedecin(id: string) {
  return useQuery({
    queryKey: ['medecins', id],
    queryFn: () => getMedecin(id),
    enabled: !!id,
  })
}
