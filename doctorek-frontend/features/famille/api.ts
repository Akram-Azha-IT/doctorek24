import { apiFetch } from '@/lib/api-client'
import type { Proche } from '@/lib/types'
import type { ProcheFormValues } from './schemas'

export function getProches(): Promise<Proche[]> {
  return apiFetch<Proche[]>('/api/v1/patients/me/proches')
}

export function addProche(payload: ProcheFormValues): Promise<Proche> {
  return apiFetch<Proche>('/api/v1/patients/me/proches', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProche(procheId: string, payload: ProcheFormValues): Promise<Proche> {
  return apiFetch<Proche>(`/api/v1/patients/me/proches/${procheId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteProche(procheId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/patients/me/proches/${procheId}`, {
    method: 'DELETE',
  })
}
