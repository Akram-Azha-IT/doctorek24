import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useDebounce } from '@/lib/hooks'
import { getMedecin, searchMedecins, searchMedecinsNearby, updateMedecin, type UpdateMedecinProfilePayload } from './api'
import type { DisponibiliteFilter } from '@/lib/disponibilite'

export type GeolocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; lat: number; lng: number }
  | { status: 'error'; message: string }

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({ status: 'idle' })

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'error', message: 'Géolocalisation non supportée par ce navigateur' })
      return
    }
    setState({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ status: 'success', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Accès à la localisation refusé'
            : 'Impossible de récupérer votre position'
        setState({ status: 'error', message })
      },
      { timeout: 10_000, maximumAge: 60_000 },
    )
  }, [])

  return { state, request }
}

export function useNearbyMedecins(
  lat: number | null,
  lng: number | null,
  radiusKm = 20,
  specialite = '',
) {
  const debouncedSpecialite = useDebounce(specialite.trim(), 400)
  return useQuery({
    queryKey: ['medecins', 'nearby', lat, lng, radiusKm, debouncedSpecialite],
    queryFn: () => searchMedecinsNearby(lat!, lng!, radiusKm, debouncedSpecialite || undefined),
    enabled: lat !== null && lng !== null,
    staleTime: 60 * 1000,
  })
}

export function useSearchMedecinsDisponibles(
  specialite: string,
  ville: string,
  filter: DisponibiliteFilter,
  page: number,
) {
  const debouncedSpecialite = useDebounce(specialite.trim(), 400)
  const debouncedVille = useDebounce(ville.trim(), 400)

  return useQuery({
    queryKey: ['medecins', 'search', debouncedSpecialite, debouncedVille, filter, page],
    queryFn: () => searchMedecins(debouncedSpecialite, debouncedVille, filter, page),
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

export function useUpdateMedecin(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateMedecinProfilePayload) => updateMedecin(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['medecins', id], updated)
    },
  })
}
