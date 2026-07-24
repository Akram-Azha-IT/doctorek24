import { apiFetch } from '@/lib/api-client'
import {
  CarteVirtuelle,
  CarteVirtuelleRequest,
  CartePublic,
  CarteSensible,
  CarteOtpChallenge,
  CarteAccessGrant,
} from '@/lib/types'

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

// Scan public : renvoie uniquement le sous-ensemble d'urgence (pas de données sensibles).
export async function getCarteByRef(cardRef: string): Promise<CartePublic> {
  return apiFetch<CartePublic>(`/api/v1/carte/ref/${cardRef}`)
}

// Demande d'un OTP : le code part vers le patient (email), pas vers le scanneur.
export async function requestCarteOtp(cardRef: string): Promise<CarteOtpChallenge> {
  return apiFetch<CarteOtpChallenge>(`/api/v1/carte/ref/${cardRef}/otp`, { method: 'POST' })
}

export async function verifyCarteOtp(cardRef: string, code: string): Promise<CarteAccessGrant> {
  return apiFetch<CarteAccessGrant>(`/api/v1/carte/ref/${cardRef}/otp/verify`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

// Lecture des données sensibles avec le jeton délivré après OTP.
export async function getCarteSensible(cardRef: string, accessToken: string): Promise<CarteSensible> {
  return apiFetch<CarteSensible>(`/api/v1/carte/ref/${cardRef}/sensible`, {
    headers: { 'X-Carte-Access': accessToken },
  })
}

export async function getGoogleWalletSaveUrl(patientId: string): Promise<{ saveUrl: string }> {
  return apiFetch<{ saveUrl: string }>(`/api/v1/carte/patient/${patientId}/wallet/google`)
}
