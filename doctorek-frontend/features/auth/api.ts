import { apiFetch } from '@/lib/api-client'
import type {
  PatientRegisteredResponse,
  PatientRegistrationPayload,
  MedecinRegisteredResponse,
  MedecinRegistrationPayload,
} from '@/lib/types'

export function registerPatient(
  payload: PatientRegistrationPayload
): Promise<PatientRegisteredResponse> {
  return apiFetch<PatientRegisteredResponse>('/api/v1/auth/register/patient', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function registerMedecin(
  payload: MedecinRegistrationPayload
): Promise<MedecinRegisteredResponse> {
  return apiFetch<MedecinRegisteredResponse>('/api/v1/auth/register/medecin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
