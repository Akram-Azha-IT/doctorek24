import { apiFetch } from '@/lib/api-client'
import type { Creneau, Disponibilite, DocumentRequis, FamilleMembre, ListeAttente, PatientSummaryPage, RendezVous } from '@/lib/types'

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
  dateRdv: string,
  heureRdv: string,
): Promise<RendezVous> {
  return apiFetch<RendezVous>(`/api/v1/agenda/rdv/${id}/reprogrammer`, {
    method: 'PUT',
    body: JSON.stringify({ dateRdv, heureRdv }),
  })
}

export function getDocumentsRequis(rdvId: string): Promise<DocumentRequis[]> {
  return apiFetch<DocumentRequis[]>(`/api/v1/agenda/rdv/${rdvId}/documents-requis`)
}

export function addDocumentsRequis(rdvId: string, libelles: string[]): Promise<DocumentRequis[]> {
  return apiFetch<DocumentRequis[]>(`/api/v1/agenda/rdv/${rdvId}/documents-requis`, {
    method: 'POST',
    body: JSON.stringify({ libelles }),
  })
}

export function deleteDocumentRequis(rdvId: string, docId: string): Promise<void> {
  return apiFetch<void>(`/api/v1/agenda/rdv/${rdvId}/documents-requis/${docId}`, {
    method: 'DELETE',
  })
}

export function marquerDocumentFourni(rdvId: string, docId: string, fourni: boolean): Promise<DocumentRequis> {
  return apiFetch<DocumentRequis>(
    `/api/v1/agenda/rdv/${rdvId}/documents-requis/${docId}/fournir?fourni=${fourni}`,
    { method: 'PUT' },
  )
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

export function rejoindreListeAttente(body: {
  medecinId: string
  patientId: string
  dateDebut: string
  dateFin: string
}): Promise<ListeAttente> {
  return apiFetch<ListeAttente>('/api/v1/agenda/liste-attente', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getListeAttente(patientId: string): Promise<ListeAttente[]> {
  return apiFetch<ListeAttente[]>(`/api/v1/agenda/patients/${patientId}/liste-attente`)
}

export function quitterListeAttente(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/agenda/liste-attente/${id}`, { method: 'DELETE' })
}

export function getFoyerPatient(medecinId: string, patientId: string): Promise<FamilleMembre[]> {
  return apiFetch<FamilleMembre[]>(
    `/api/v1/agenda/medecins/${medecinId}/patients/${patientId}/foyer`,
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
// ── Compte famille : création de RDV par le praticien ──────────────────────

export interface CreerRdvMedecinPayload {
  patientId?: string
  nouveauPatient?: {
    nom: string
    prenom: string
    dateNaissance?: string
    email?: string
    telephone?: string
  }
  dateRdv: string
  heureRdv: string
  motif?: string
}

export interface CreerRdvMedecinResult {
  rdv: RendezVous
  emailRattachementEnvoye: boolean
}

export function creerRdvMedecin(payload: CreerRdvMedecinPayload): Promise<CreerRdvMedecinResult> {
  return apiFetch<CreerRdvMedecinResult>('/api/v1/agenda/medecins/rdv', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
