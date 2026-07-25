import { apiFetch } from '@/lib/api-client'
import type { AdminStats, UsersPage, CartesPage } from './types'
import type { CarteVirtuelle } from '@/lib/types'

export function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>('/api/v1/admin/stats')
}

export function getAdminUsers(
  role: string,
  search: string,
  page: number,
  size: number,
): Promise<UsersPage> {
  const params = new URLSearchParams({ search, page: String(page), size: String(size) })
  if (role) params.set('role', role)
  return apiFetch<UsersPage>(`/api/v1/admin/users?${params}`)
}

export function toggleUserActive(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/admin/users/${id}/toggle-active`, { method: 'PUT' })
}

export function deleteUser(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/admin/users/${id}`, { method: 'DELETE' })
}

export function getAdminCartes(page: number, size: number): Promise<CartesPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return apiFetch<CartesPage>(`/api/v1/admin/cartes?${params}`)
}

export function getPatientCarte(patientId: string): Promise<CarteVirtuelle> {
  return apiFetch<CarteVirtuelle>(`/api/v1/admin/patients/${patientId}/carte`)
}
