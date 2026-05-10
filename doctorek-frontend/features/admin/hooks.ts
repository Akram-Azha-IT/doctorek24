import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminStats, getAdminUsers, toggleUserActive, getAdminCartes, getPatientCarte } from './api'

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
  })
}

export function useAdminUsers(role: string, search: string, page: number, size = 20) {
  return useQuery({
    queryKey: ['admin', 'users', role, search, page, size],
    queryFn: () => getAdminUsers(role, search, page, size),
  })
}

export function useToggleUserActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleUserActive,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useAdminCartes(page: number, size = 20) {
  return useQuery({
    queryKey: ['admin', 'cartes', page, size],
    queryFn: () => getAdminCartes(page, size),
  })
}

export function usePatientCarte(patientId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['admin', 'patient-carte', patientId],
    queryFn: () => getPatientCarte(patientId),
    enabled,
    retry: false,
  })
}
