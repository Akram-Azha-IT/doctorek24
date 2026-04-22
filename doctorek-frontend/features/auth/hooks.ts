import { useMutation } from '@tanstack/react-query'
import { registerPatient, registerMedecin, verifyEmail } from './api'
import type { PatientRegistrationPayload, MedecinRegistrationPayload, VerifyEmailPayload } from '@/lib/types'

export function useRegisterPatient() {
  return useMutation({
    mutationFn: (payload: PatientRegistrationPayload) => registerPatient(payload),
  })
}

export function useRegisterMedecin() {
  return useMutation({
    mutationFn: (payload: MedecinRegistrationPayload) => registerMedecin(payload),
  })
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (payload: VerifyEmailPayload) => verifyEmail(payload),
  })
}
