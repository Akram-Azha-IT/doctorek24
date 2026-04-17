import { apiFetch } from '@/lib/api-client'
import type { Creneau, Disponibilite, RendezVous } from '@/lib/types'

export function getCreneaux(medecinId: string, date: string): Promise<Creneau[]> {
  return apiFetch<Creneau[]>(
    `/api/v1/agenda/medecins/${medecinId}/creneaux?date=${date}`,
  )
}

export function getRdvsPatient(patientId: string): Promise<RendezVous[]> {
  return apiFetch<RendezVous[]>(`/api/v1/agenda/patients/${patientId}/rdv`)
}

export function getRdvsMedecin(medecinId: string): Promise<RendezVous[]> {
  return apiFetch<RendezVous[]>(`/api/v1/agenda/medecins/${medecinId}/rdv`)
}

export function prendreRdv(payload: {
  medecinId: string
  patientId: string
  dateRdv: string
  heureRdv: string
  motif?: string
  questionnaire?: import('@/lib/types').QuestionnairePreConsult
}): Promise<RendezVous> {
  return apiFetch<RendezVous>('/api/v1/agenda/rdv', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function annulerRdv(id: string): Promise<RendezVous> {
  return apiFetch<RendezVous>(`/api/v1/agenda/rdv/${id}/annuler`, {
    method: 'PUT',
  })
}

export function getDisponibilites(medecinId: string): Promise<Disponibilite[]> {
  return apiFetch<Disponibilite[]>(
    `/api/v1/agenda/medecins/${medecinId}/disponibilites`,
  )
}

export function defineDisponibilite(
  medecinId: string,
  payload: {
    jourSemaine: string
    heureDebut: string
    heureFin: string
    dureeConsultation: number
  },
): Promise<Disponibilite> {
  return apiFetch<Disponibilite>(
    `/api/v1/agenda/medecins/${medecinId}/disponibilites`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}