import { apiFetch } from '@/lib/api-client'
import type { Creneau, Disponibilite, PatientSummaryPage, RendezVous } from '@/lib/types'

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

export function reprogrammerRdv(
  id: string,
  nouvelleDateRdv: string,
  nouvelleHeureRdv: string,
): Promise<RendezVous> {
  return apiFetch<RendezVous>(`/api/v1/agenda/rdv/${id}/reprogrammer`, {
    method: 'PUT',
    body: JSON.stringify({ nouvelleDateRdv, nouvelleHeureRdv }),
  })
}

export function confirmerRdv(id: string): Promise<RendezVous> {
  return apiFetch<RendezVous>(`/api/v1/agenda/rdv/${id}/confirmer`, {
    method: 'PUT',
  })
}

export function terminerRdv(id: string): Promise<RendezVous> {
  return apiFetch<RendezVous>(`/api/v1/agenda/rdv/${id}/terminer`, {
    method: 'PUT',
  })
}

export function getDisponibilites(medecinId: string): Promise<Disponibilite[]> {
  return apiFetch<Disponibilite[]>(
    `/api/v1/agenda/medecins/${medecinId}/disponibilites`,
  )
}

export function getPatientsMedecin(
  medecinId: string,
  search: string,
  filtre: string,
  page: number,
  size = 20,
): Promise<PatientSummaryPage> {
  const params = new URLSearchParams({
    search,
    filtre,
    page: String(page),
    size: String(size),
  })
  return apiFetch<PatientSummaryPage>(
    `/api/v1/agenda/medecins/${medecinId}/patients?${params}`,
  )
}

export function defineDisponibilite(
  medecinId: string,
  payload: {
    jourSemaine: string
    heureDebut: string
    heureFin: string
    dureeConsultation: number
    frequence?: string
    intervalSemaines?: number
    dateDebut?: string
    typeFinRecurrence?: string
    dateFin?: string | null
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

export function deleteDisponibilite(
  medecinId: string,
  dispoId: string,
): Promise<void> {
  return apiFetch<void>(
    `/api/v1/agenda/medecins/${medecinId}/disponibilites/${dispoId}`,
    { method: 'DELETE' },
  )
}