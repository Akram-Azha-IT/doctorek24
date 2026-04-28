import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createOrdonnance,
  deleteDocument,
  deleteOrdonnance,
  getDocuments,
  getInfosMedicales,
  getOrdonnances,
  uploadDocument,
  upsertInfosMedicales,
  type CreateOrdonnancePayload,
  type UpsertInfosPayload,
} from './api'

// ── Keys ───────────────────────────────────────────────────────────────────

const keys = {
  infos: (patientId: string) => ['dossier', patientId, 'infos'] as const,
  ordonnances: (patientId: string) => ['dossier', patientId, 'ordonnances'] as const,
  documents: (patientId: string) => ['dossier', patientId, 'documents'] as const,
}

// ── Infos médicales ────────────────────────────────────────────────────────

export function useInfosMedicales(patientId: string) {
  return useQuery({
    queryKey: keys.infos(patientId),
    queryFn: () => getInfosMedicales(patientId),
    enabled: !!patientId,
  })
}

export function useUpsertInfosMedicales(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertInfosPayload) => upsertInfosMedicales(patientId, payload),
    onSuccess: (data) => {
      qc.setQueryData(keys.infos(patientId), data)
    },
  })
}

// ── Ordonnances ────────────────────────────────────────────────────────────

export function useOrdonnances(patientId: string) {
  return useQuery({
    queryKey: keys.ordonnances(patientId),
    queryFn: () => getOrdonnances(patientId),
    enabled: !!patientId,
  })
}

export function useCreateOrdonnance(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOrdonnancePayload) => createOrdonnance(patientId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.ordonnances(patientId) })
    },
  })
}

export function useDeleteOrdonnance(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ordonnanceId: string) => deleteOrdonnance(patientId, ordonnanceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.ordonnances(patientId) })
    },
  })
}

// ── Documents ──────────────────────────────────────────────────────────────

export function useDocuments(patientId: string) {
  return useQuery({
    queryKey: keys.documents(patientId),
    queryFn: () => getDocuments(patientId),
    enabled: !!patientId,
  })
}

export function useUploadDocument(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ typeDoc, file }: { typeDoc: string; file: File }) =>
      uploadDocument(patientId, typeDoc, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.documents(patientId) })
    },
  })
}

export function useDeleteDocument(patientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(patientId, documentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.documents(patientId) })
    },
  })
}
