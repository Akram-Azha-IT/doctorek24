import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  annulerRdv,
  confirmerRdv,
  defineDisponibilite,
  getCreneaux,
  getDisponibilites,
  getRdvsPatient,
  getRdvsMedecin,
  prendreRdv,
  terminerRdv,
} from './api'

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

export function useRdvsMedecin(medecinId: string) {
  return useQuery({
    queryKey: ['rdvs', 'medecin', medecinId],
    queryFn: () => getRdvsMedecin(medecinId),
    enabled: !!medecinId,
  })
}

export function useDisponibilites(medecinId: string) {
  return useQuery({
    queryKey: ['disponibilites', medecinId],
    queryFn: () => getDisponibilites(medecinId),
    enabled: !!medecinId,
  })
}

export function useConfirmerRdv(medecinId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: confirmerRdv,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rdvs', 'medecin', medecinId] })
    },
  })
}

export function useTerminerRdv(medecinId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: terminerRdv,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rdvs', 'medecin', medecinId] })
    },
  })
}

export function useAnnulerRdvMedecin(medecinId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: annulerRdv,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rdvs', 'medecin', medecinId] })
    },
  })
}

export function useDefineDisponibilite(medecinId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      jourSemaine: string
      heureDebut: string
      heureFin: string
      dureeConsultation: number
    }) => defineDisponibilite(medecinId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disponibilites', medecinId] })
    },
  })
}