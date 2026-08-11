import { apiFetch } from '@/lib/api-client'
import type { Avis, AvisPage, NoteMedecin, StatutAvis } from '@/lib/types'

export interface CreerAvisPayload {
  rdvId: string
  note: number
  commentaire?: string | null
  anonyme: boolean
}

export function getAvisMedecin(medecinId: string, page = 1, size = 10): Promise<AvisPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return apiFetch<AvisPage>(`/api/v1/annuaire/medecins/${medecinId}/avis?${params}`)
}

/**
 * Notes des médecins d'une page de résultats, en une seule requête.
 *
 * Les médecins sans avis sont absents du tableau renvoyé.
 */
export function getNotesMedecins(medecinIds: string[]): Promise<NoteMedecin[]> {
  const params = new URLSearchParams({ ids: medecinIds.join(',') })
  return apiFetch<NoteMedecin[]>(`/api/v1/avis/notes?${params}`)
}

export function creerAvis(payload: CreerAvisPayload): Promise<Avis> {
  return apiFetch<Avis>('/api/v1/avis', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Parmi des rendez-vous affichés, ceux que le patient peut encore noter.
 *
 * Le serveur reste seul juge : cette liste ne décide que de l'affichage du bouton.
 */
export function getRdvsNotables(rdvIds: string[]): Promise<string[]> {
  return apiFetch<string[]>('/api/v1/avis/notables', {
    method: 'POST',
    body: JSON.stringify({ rdvIds }),
  })
}

export function signalerAvis(avisId: string, motif?: string): Promise<void> {
  return apiFetch<void>(`/api/v1/avis/${avisId}/signalement`, {
    method: 'POST',
    body: JSON.stringify({ motif: motif ?? null }),
  })
}

export function getFileModeration(page = 1, size = 20): Promise<AvisPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return apiFetch<AvisPage>(`/api/v1/avis/moderation?${params}`)
}

export function modererAvis(avisId: string, statut: StatutAvis): Promise<Avis> {
  return apiFetch<Avis>(`/api/v1/avis/${avisId}/moderation?statut=${statut}`, {
    method: 'PUT',
  })
}
