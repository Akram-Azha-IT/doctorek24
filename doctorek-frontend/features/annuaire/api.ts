import { apiFetch } from '@/lib/api-client'
import type { MedecinNearbyResult, MedecinProfile } from '@/lib/types'

export interface UpdateMedecinProfilePayload {
  firstName: string
  lastName: string
  phone?: string
  specialite: string
  ville: string
  adresse?: string
  lang?: string
  latitude?: number | null
  longitude?: number | null
}

export function updateMedecin(id: string, data: UpdateMedecinProfilePayload): Promise<MedecinProfile> {
  return apiFetch<MedecinProfile>(`/api/v1/annuaire/medecins/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function updateMedecinPhoto(id: string, photoUrl: string): Promise<MedecinProfile> {
  return apiFetch<MedecinProfile>(`/api/v1/annuaire/medecins/${id}/photo`, {
    method: 'PUT',
    body: JSON.stringify({ photoUrl }),
  })
}
import type { DisponibiliteFilter } from '@/lib/disponibilite'

export interface PagedMedecinsResponse {
  content: MedecinProfile[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export function searchMedecins(
  specialite: string,
  ville: string,
  disponibilite: DisponibiliteFilter = 'all',
  page = 1,
  size = 10,
): Promise<PagedMedecinsResponse> {
  const params = new URLSearchParams()
  if (specialite.trim()) params.set('specialite', specialite.trim())
  if (ville.trim()) params.set('ville', ville.trim())
  if (disponibilite !== 'all') params.set('disponibilite', disponibilite)
  params.set('page', String(page))
  params.set('size', String(size))
  return apiFetch<PagedMedecinsResponse>(`/api/v1/annuaire/medecins?${params}`)
}

export function getMedecin(id: string): Promise<MedecinProfile> {
  return apiFetch<MedecinProfile>(`/api/v1/annuaire/medecins/${id}`)
}

export function searchMedecinsNearby(
  lat: number,
  lng: number,
  radiusKm: number,
  specialite?: string,
): Promise<MedecinNearbyResult[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radiusKm),
  })
  if (specialite?.trim()) params.set('specialite', specialite.trim())
  return apiFetch<MedecinNearbyResult[]>(`/api/v1/annuaire/medecins/nearby?${params}`)
}

