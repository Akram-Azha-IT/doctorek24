import { apiFetch } from '@/lib/api-client'
import { CarteVirtuelle, CarteVirtuelleRequest } from '@/lib/types'

export async function createCarte(data: CarteVirtuelleRequest): Promise<CarteVirtuelle> {
  return apiFetch<CarteVirtuelle>('/api/v1/carte', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getCarteByPatient(patientId: string): Promise<CarteVirtuelle> {
  return apiFetch<CarteVirtuelle>(`/api/v1/carte/patient/${patientId}`)
}

export async function carteExists(patientId: string): Promise<boolean> {
  return apiFetch<boolean>(`/api/v1/carte/patient/${patientId}/exists`)
}

export async function updateCarte(
  patientId: string,
  data: CarteVirtuelleRequest
): Promise<CarteVirtuelle> {
  return apiFetch<CarteVirtuelle>(`/api/v1/carte/patient/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function getCarteByRef(cardRef: string): Promise<CarteVirtuelle> {
  return apiFetch<CarteVirtuelle>(`/api/v1/carte/ref/${cardRef}`)
}
