export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

export interface MedecinProfile {
  id: string
  firstName: string
  lastName: string
  specialite: string
  ville: string
  adresse: string
  inpe: string
  secteurTarifaire?: 1 | 2 | 3
  langues?: string[]
  presentation?: string
  acceptNouveauxPatients?: boolean
}

export interface PatientRegistrationPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  lang?: string
}

export interface PatientRegisteredResponse {
  id: string
  email: string
  firstName: string
  lastName: string
}

export interface MedecinRegistrationPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  inpe: string
  specialite: string
  ville: string
  adresse?: string
  lang?: string
}

export interface MedecinRegisteredResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  inpe: string
}

// ── Agenda ──────────────────────────────────────────────────────────────────

export interface Creneau {
  debut: string   // "HH:mm"
  fin: string     // "HH:mm"
  disponible: boolean
}

export interface Disponibilite {
  id: string
  medecinId: string
  jourSemaine: string   // "LUNDI" | "MARDI" | …
  heureDebut: string
  heureFin: string
  dureeConsultation: number
}

export type StatutRdv = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE'

export interface QuestionnairePreConsult {
  motif: string
  premierConsultation: boolean
  intensiteDouleur?: 1 | 2 | 3 | 4 | 5
  dureeSymptoomes?: 'moins_7j' | '1_4sem' | 'plus_1mois' | null
  notesComplementaires?: string
}

export interface RendezVous {
  id: string
  medecinId: string
  patientId: string
  dateRdv: string    // "YYYY-MM-DD"
  heureRdv: string   // "HH:mm"
  duree: number
  statut: StatutRdv
  motif: string | null
  questionnaire?: QuestionnairePreConsult | null
  createdAt: string
}
