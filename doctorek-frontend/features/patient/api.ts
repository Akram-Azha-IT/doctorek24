import { apiFetch } from '@/lib/api-client'
import { PatientProfile, PatientProfileRequest } from '@/lib/types'

export async function getPatientProfile(userId: string): Promise<PatientProfile> {
  return apiFetch<PatientProfile>(`/api/v1/patients/${userId}/profile`)
}

export async function upsertPatientProfile(
  userId: string,
  data: PatientProfileRequest
): Promise<PatientProfile> {
  return apiFetch<PatientProfile>(`/api/v1/patients/${userId}/profile`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
