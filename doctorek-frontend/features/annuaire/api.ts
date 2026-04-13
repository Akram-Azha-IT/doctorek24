import { apiFetch } from '@/lib/api-client'
import type { MedecinProfile } from '@/lib/types'

export function searchMedecins(specialite: string, ville: string): Promise<MedecinProfile[]> {
  const params = new URLSearchParams()
  if (specialite.trim()) params.set('specialite', specialite.trim())
  if (ville.trim()) params.set('ville', ville.trim())
  const qs = params.toString()
  return apiFetch<MedecinProfile[]>(`/api/v1/annuaire/medecins${qs ? `?${qs}` : ''}`)
}

export function getMedecin(id: string): Promise<MedecinProfile> {
  return apiFetch<MedecinProfile>(`/api/v1/annuaire/medecins/${id}`)
}
