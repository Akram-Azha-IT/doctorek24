import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { annulerRdv, getCreneaux, getRdvsPatient, prendreRdv } from './api'

export function useCreneaux(medecinId: string, date: string) {
  return useQuery({
    queryKey: ['creneaux', medecinId, date],
    queryFn: () => getCreneaux(medecinId, date),
    enabled: !!medecinId && !!date,
    staleTime: 30 * 1000,
  })
}

export function useRdvsPatient(patientId: string) {
  return useQuery({
    queryKey: ['rdvs', patientId],
    queryFn: () => getRdvsPatient(patientId),
    enabled: !!patientId,
  })
}

export function usePrendreRdv(medecinId: string, date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: prendreRdv,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['creneaux', medecinId, date] })
    },
  })
}

export function useAnnulerRdv(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: annulerRdv,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rdvs', patientId] })
    },
  })
}