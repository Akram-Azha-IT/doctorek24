import { apiFetch } from '@/lib/api-client'
import type { Proche, RoleGestion } from '@/lib/types'

export interface RattachementInfo {
  medecinNom: string | null
  dateRdv: string | null
  heureRdv: string | null
  prenomInitiale: string
  expire: boolean
  utilise: boolean
}

export interface ReclamerRattachementPayload {
  troisLettres: string
  pourMoi: boolean
  role?: RoleGestion
  declarationRepresentantLegal?: boolean
}

export function getRattachementInfo(token: string): Promise<RattachementInfo> {
  return apiFetch<RattachementInfo>(`/api/v1/patients/rattachement/${token}`)
}

export function reclamerRattachement(
  token: string,
  payload: ReclamerRattachementPayload,
): Promise<Proche> {
  return apiFetch<Proche>(`/api/v1/patients/rattachement/${token}/reclamer`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
