import { useMutation } from '@tanstack/react-query'
import { registerPatient, registerMedecin } from './api'
import type { PatientRegistrationPayload, MedecinRegistrationPayload } from '@/lib/types'

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
