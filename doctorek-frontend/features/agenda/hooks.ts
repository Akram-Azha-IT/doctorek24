import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  annulerRdv,
  confirmerRdv,
  defineDisponibilite,
  deleteDisponibilite,
  getCreneaux,
  getDisponibilites,
  getPatientsMedecin,
  getRdvsPatient,
  getRdvsMedecin,
  prendreRdv,
  reprogrammerRdv,
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

export function useReprogrammerRdv(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, date, heure }: { id: string; date: string; heure: string }) =>
      reprogrammerRdv(id, date, heure),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rdvs', patientId] })
    },
  })
}

export function usePatientsMedecin(
  medecinId: string,
  search: string,
  filtre: string,
  page: number,
) {
  return useQuery({
    queryKey: ['patients', 'medecin', medecinId, search, filtre, page],
    queryFn: () => getPatientsMedecin(medecinId, search, filtre, page),
    enabled: !!medecinId,
    staleTime: 30 * 1000,
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

export function useDeleteDisponibilite(medecinId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dispoId: string) => deleteDisponibilite(medecinId, dispoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disponibilites', medecinId] })
    },
  })
}