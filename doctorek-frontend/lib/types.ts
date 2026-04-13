export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

export interface MedecinProfile {
  id: string
  firstName: string
  lastName: string
  specialite: string
  ville: string
  adresse: string
  inpe: string
}

export interface PatientRegistrationPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  lang?: string
}

export interface PatientRegisteredResponse {
  id: string
  email: string
  firstName: string
  lastName: string
}

export interface MedecinRegistrationPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  inpe: string
  specialite: string
  ville: string
  adresse?: string
  lang?: string
}

export interface MedecinRegisteredResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  inpe: string
}
