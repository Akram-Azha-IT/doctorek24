import { apiFetch } from '@/lib/api-client'
import type { ApiResponse } from '@/lib/types'

const BASE = process.env.NEXT_PUBLIC_API_URL

// ── Types ──────────────────────────────────────────────────────────────────

export interface InfosMedicales {
  patientId: string
  groupeSanguin: string | null
  allergies: string[]
  antecedents: string | null
  traitementsCours: string | null
  notesGenerales: string | null
}

export interface MedicamentDto {
  nom: string
  dosage: string
  frequence: string
  duree: string
}

export interface OrdonnanceDto {
  id: string
  patientId: string
  medecinId: string
  dateEmission: string
  medicaments: MedicamentDto[]
  notes: string | null
}

export interface DocumentMedicalDto {
  id: string
  patientId: string
  nom: string
  typeDoc: string
  taille: number | null
  createdAt: string
}

export interface UpsertInfosPayload {
  groupeSanguin: string | null
  allergies: string[]
  antecedents: string | null
  traitementsCours: string | null
  notesGenerales: string | null
}

export interface CreateOrdonnancePayload {
  medecinId: string
  medicaments: MedicamentDto[]
  notes: string | null
}

// ── Infos médicales ────────────────────────────────────────────────────────

export function getInfosMedicales(patientId: string): Promise<InfosMedicales> {
  return apiFetch<InfosMedicales>(`/api/v1/dossier/patients/${patientId}/infos`)
}

export function upsertInfosMedicales(
  patientId: string,
  payload: UpsertInfosPayload,
): Promise<InfosMedicales> {
  return apiFetch<InfosMedicales>(`/api/v1/dossier/patients/${patientId}/infos`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// ── Ordonnances ────────────────────────────────────────────────────────────

export function getOrdonnances(patientId: string): Promise<OrdonnanceDto[]> {
  return apiFetch<OrdonnanceDto[]>(`/api/v1/dossier/patients/${patientId}/ordonnances`)
}

export function createOrdonnance(
  patientId: string,
  payload: CreateOrdonnancePayload,
): Promise<OrdonnanceDto> {
  return apiFetch<OrdonnanceDto>(`/api/v1/dossier/patients/${patientId}/ordonnances`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteOrdonnance(patientId: string, ordonnanceId: string): Promise<void> {
  return apiFetch<void>(
    `/api/v1/dossier/patients/${patientId}/ordonnances/${ordonnanceId}`,
    { method: 'DELETE' },
  )
}

// ── Documents ──────────────────────────────────────────────────────────────

export function getDocuments(patientId: string): Promise<DocumentMedicalDto[]> {
  return apiFetch<DocumentMedicalDto[]>(`/api/v1/dossier/patients/${patientId}/documents`)
}

export async function uploadDocument(
  patientId: string,
  typeDoc: string,
  file: File,
): Promise<DocumentMedicalDto> {
  const form = new FormData()
  form.append('typeDoc', typeDoc)
  form.append('file', file)
  const res = await fetch(`${BASE}/api/v1/dossier/patients/${patientId}/documents`, {
    method: 'POST',
    body: form,
  })
  const body: ApiResponse<DocumentMedicalDto> = await res.json()
  if (!body.success || !res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
  return body.data as DocumentMedicalDto
}

export function deleteDocument(patientId: string, documentId: string): Promise<void> {
  return apiFetch<void>(
    `/api/v1/dossier/patients/${patientId}/documents/${documentId}`,
    { method: 'DELETE' },
  )
}

export function getDocumentDownloadUrl(patientId: string, documentId: string): string {
  return `${BASE}/api/v1/dossier/patients/${patientId}/documents/${documentId}/download`
}
