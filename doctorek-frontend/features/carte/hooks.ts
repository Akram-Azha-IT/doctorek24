'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CarteVirtuelleRequest } from '@/lib/types'
import { carteExists, createCarte, getCarteByPatient, updateCarte } from './api'

export function useCarteByPatient(patientId: string | null) {
  return useQuery({
    queryKey: ['carte', patientId],
    queryFn: () => getCarteByPatient(patientId!),
    enabled: !!patientId,
    retry: false,
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
