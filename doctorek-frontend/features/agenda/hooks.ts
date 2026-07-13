import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addDocumentsRequis,
  annulerRdv,
  confirmerRdv,
  defineDisponibilite,
  deleteDisponibilite,
  deleteDocumentRequis,
  getCreneaux,
  getDisponibilites,
  getDocumentsRequis,
  getPatientsMedecin,
  getRdvsPatient,
  getRdvsMedecin,
  marquerDocumentFourni,
  prendreRdv,
  reprogrammerRdv,
  terminerRdv,
} from './api'

export function useDocumentsRequis(rdvId: string, enabled = true) {
  return useQuery({
    queryKey: ['documents-requis', rdvId],
    queryFn: () => getDocumentsRequis(rdvId),
    enabled: !!rdvId && enabled,
  })
}

export function useAddDocumentsRequis(rdvId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (libelles: string[]) => addDocumentsRequis(rdvId, libelles),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents-requis', rdvId] })
    },
  })
}

export function useDeleteDocumentRequis(rdvId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (docId: string) => deleteDocumentRequis(rdvId, docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents-requis', rdvId] })
    },
  })
}

export function useMarquerDocumentFourni(rdvId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ docId, fourni }: { docId: string; fourni: boolean }) =>
      marquerDocumentFourni(rdvId, docId, fourni),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents-requis', rdvId] })
    },
  })
}

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
      qc.invalidateQueries({ queryKey: ['creneaux'] })
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
    mutationFn: (payload: Parameters<typeof defineDisponibilite>[1]) =>
      defineDisponibilite(medecinId, payload),
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