'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CarteVirtuelleRequest } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { carteExists, createCarte, getCarteByPatient, updateCarte } from './api'

export function useCarteByPatient(patientId: string | null) {
  return useQuery({
    queryKey: ['carte', patientId],
    queryFn: async () => {
      try {
        return await getCarteByPatient(patientId!)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }
    },
    enabled: !!patientId,
    retry: false,
    // Au premier login, la carte est provisionnée côté backend : la première requête
    // peut tomber avant la création (404 → null) ou juste après un login brokeré dont
    // le token n'a pas encore le rôle (403 → erreur). Dans les deux cas on re-tente
    // toutes les 3 s tant qu'aucune carte n'est chargée, puis on stoppe dès qu'elle existe.
    refetchInterval: (query) => (query.state.data ? false : 3000),
    refetchIntervalInBackground: true,
  })
}

export function useCarteExists(patientId: string | null) {
  return useQuery({
    queryKey: ['carte-exists', patientId],
    queryFn: () => carteExists(patientId!),
    enabled: !!patientId,
  })
}

export function useCreateCarte() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CarteVirtuelleRequest) => createCarte(data),
    onSuccess: (carte) => {
      queryClient.invalidateQueries({ queryKey: ['carte', carte.patientId] })
      queryClient.invalidateQueries({ queryKey: ['carte-exists', carte.patientId] })
    },
  })
}

export function useUpdateCarte(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CarteVirtuelleRequest) => updateCarte(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carte', patientId] })
    },
  })
}
