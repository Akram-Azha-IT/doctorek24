import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  accepterConsentement,
  getConsentementStatut,
  registerPatient,
  registerMedecin,
  verifyEmail,
} from './api'
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

/**
 * Consentement encore attendu de l'utilisateur connecté.
 *
 * Question posée au serveur plutôt que lue dans la session : la session est un jeton figé
 * jusqu'au prochain rafraîchissement, l'écran resurgirait après acceptation.
 */
export function useConsentementStatut(enabled = true) {
  return useQuery({
    queryKey: ['auth', 'consentement'],
    queryFn: getConsentementStatut,
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export function useAccepterConsentement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accepterConsentement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'consentement'] })
    },
  })
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (payload: VerifyEmailPayload) => verifyEmail(payload),
  })
}
