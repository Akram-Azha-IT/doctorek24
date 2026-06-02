'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PatientProfileRequest } from '@/lib/types'
import { getPatientProfile, upsertPatientProfile } from './api'

export function usePatientProfile(userId: string | null) {
  return useQuery({
    queryKey: ['patient-profile', userId],
    queryFn: () => getPatientProfile(userId!),
    enabled: !!userId,
  })
}

export function useUpsertPatientProfile(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: PatientProfileRequest) => upsertPatientProfile(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', userId] })
    },
  })
}
