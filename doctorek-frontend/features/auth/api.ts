import { apiFetch } from '@/lib/api-client'
import type {
  ConsentementStatut,
  PatientRegisteredResponse,
  PatientRegistrationPayload,
  MedecinRegisteredResponse,
  MedecinRegistrationPayload,
  VerifyEmailPayload,
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

/** Le compte connecté doit-il encore donner son consentement (loi 09-08) ? */
export function getConsentementStatut(): Promise<ConsentementStatut> {
  return apiFetch<ConsentementStatut>('/api/v1/auth/consentement')
}

export function accepterConsentement(): Promise<ConsentementStatut> {
  return apiFetch<ConsentementStatut>('/api/v1/auth/consentement', { method: 'POST' })
}

export function verifyEmail(payload: VerifyEmailPayload): Promise<void> {
  return apiFetch<void>('/api/v1/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
