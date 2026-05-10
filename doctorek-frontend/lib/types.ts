export interface ApiResponse<T> {
  success: boolean
  data: T | null
  message: string | null
}

export interface MedecinProfile {
  id: string
  firstName: string
  lastName: string
  specialite: string
  ville: string
  adresse: string
  inpe: string
  latitude?: number | null
  longitude?: number | null
  photoUrl?: string | null
  secteurTarifaire?: 1 | 2 | 3
  langues?: string[]
  presentation?: string
  acceptNouveauxPatients?: boolean
}

export interface MedecinNearbyResult {
  medecin: MedecinProfile
  distanceKm: number
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

export interface VerifyEmailPayload {
  userId: string
  code: string
}

// ── Agenda ──────────────────────────────────────────────────────────────────

export interface Creneau {
  debut: string   // "HH:mm"
  fin: string     // "HH:mm"
  disponible: boolean
}

export type FrequenceDisponibilite = 'UNE_SEULE_FOIS' | 'TOUTES_LES_SEMAINES' | 'PERSONNALISE'
export type TypeFinRecurrence = 'JAMAIS' | 'DATE'

export interface Disponibilite {
  id: string
  medecinId: string
  jourSemaine: string   // "LUNDI" | "MARDI" | …
  heureDebut: string
  heureFin: string
  dureeConsultation: number
  frequence: FrequenceDisponibilite
  intervalSemaines: number
  dateDebut: string     // "YYYY-MM-DD"
  typeFinRecurrence: TypeFinRecurrence
  dateFin: string | null
}

export type StatutRdv = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE'

export interface QuestionnairePreConsult {
  motif: string
  premierConsultation: boolean
  intensiteDouleur?: 1 | 2 | 3 | 4 | 5
  dureeSymptoomes?: 'moins_7j' | '1_4sem' | 'plus_1mois' | null
  notesComplementaires?: string
}

// ── Carte Virtuelle ─────────────────────────────────────────────────────────

export interface MedicamentActuel {
  nom: string
  dosage: string
}

export interface AntecedentChirurgical {
  description: string
  date?: string
}

export interface ContactUrgence {
  nom: string
  lien: string
  telephone: string
}

export interface CarteVirtuelle {
  id: string
  patientId: string
  cardRef: string
  statut: 'VIRTUEL'
  firstName: string | null
  lastName: string | null
  dateNaissance: string | null
  genre: string | null
  nationalite: string | null
  numIdentite: string | null
  photoUrl: string | null
  telephone: string | null
  adresseRue: string | null
  adresseVille: string | null
  adressePays: string | null
  groupeSanguin: string | null
  tailleCm: number | null
  poidsKg: number | null
  donneurOrganes: boolean
  allergies: string[]
  maladiesChroniques: string[]
  medicamentsActuels: MedicamentActuel[]
  antecedentsChirurgicaux: AntecedentChirurgical[]
  vaccinations: string[]
  antecedentsFamiliaux: string[]
  contactsUrgence: ContactUrgence[]
  medecinTraitant: string | null
  assuranceNom: string | null
  assuranceNumero: string | null
  assuranceDetails: string | null
  createdAt: string
  updatedAt: string
}

export interface CarteVirtuelleRequest {
  patientId: string
  dateNaissance?: string | null
  genre?: string | null
  nationalite?: string | null
  numIdentite?: string | null
  photoUrl?: string | null
  telephone?: string | null
  adresseRue?: string | null
  adresseVille?: string | null
  adressePays?: string | null
  groupeSanguin?: string | null
  tailleCm?: number | null
  poidsKg?: number | null
  donneurOrganes?: boolean
  allergies?: string[]
  maladiesChroniques?: string[]
  medicamentsActuels?: MedicamentActuel[]
  antecedentsChirurgicaux?: AntecedentChirurgical[]
  vaccinations?: string[]
  antecedentsFamiliaux?: string[]
  contactsUrgence?: ContactUrgence[]
  medecinTraitant?: string | null
  assuranceNom?: string | null
  assuranceNumero?: string | null
  assuranceDetails?: string | null
}

// ── Patients ─────────────────────────────────────────────────────────────────

export interface PatientSummary {
  patientId: string
  firstName: string
  lastName: string
  dernierRdvDate: string   // "YYYY-MM-DD"
  dernierRdvStatut: StatutRdv
  hasFutureRdv: boolean
}

export interface PatientSummaryPage {
  patients: PatientSummary[]
  total: number
  page: number
  size: number
}

export interface RendezVous {
  id: string
  medecinId: string
  patientId: string
  patientPrenom?: string | null
  patientNom?: string | null
  dateRdv: string    // "YYYY-MM-DD"
  heureRdv: string   // "HH:mm"
  duree: number
  statut: StatutRdv
  motif: string | null
  questionnaire?: QuestionnairePreConsult | null
  createdAt: string
}
