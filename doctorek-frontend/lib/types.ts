export interface AppNotification {
  id: string
  type: 'CARTE_CREEE' | 'MESSAGE_RECU' | 'ANNIVERSAIRE' | 'DOCUMENT_RECU' | 'RDV_RAPPEL' | string
  title: string
  body: string | null
  data: string | null
  read: boolean
  createdAt: string
}

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
  consultationVideo?: boolean
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

/** Document (médical ou administratif) demandé au patient en amont d'un RDV. */
export interface DocumentRequis {
  id: string
  rdvId: string
  libelle: string
  fourni: boolean
  createdAt: string
}

export type TypeConsultation = 'CONSULTATION' | 'URGENCE'

export interface QuestionnairePreConsult {
  typeConsultation: TypeConsultation
  message: string
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

// Sous-ensemble d'urgence renvoyé au scan public du QR (sans données sensibles).
export interface CartePublic {
  id: string
  patientId: string
  cardRef: string
  statut: 'VIRTUEL'
  firstName: string | null
  lastName: string | null
  groupeSanguin: string | null
  tailleCm: number | null
  poidsKg: number | null
  donneurOrganes: boolean
  allergies: string[]
  maladiesChroniques: string[]
  contactsUrgence: ContactUrgence[]
  createdAt: string
  updatedAt: string
}

// Partie sensible, obtenue seulement après OTP validé par le patient.
export interface CarteSensible {
  medicamentsActuels: MedicamentActuel[]
  antecedentsChirurgicaux: AntecedentChirurgical[]
  vaccinations: string[]
  antecedentsFamiliaux: string[]
  medecinTraitant: string | null
  assuranceNom: string | null
  assuranceNumero: string | null
  assuranceDetails: string | null
}

export interface CarteOtpChallenge {
  maskedDestination: string
  expiresInSec: number
}

export interface CarteAccessGrant {
  accessToken: string
  expiresInSec: number
}

export interface CarteVirtuelleRequest {
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

// ── Patient profile (identity / contact) ─────────────────────────────────────

export interface PatientProfile {
  userId: string
  firstName: string
  lastName: string
  dateNaissance: string | null
  genre: string | null
  nationalite: string | null
  numIdentite: string | null
  photoUrl: string | null
  telephone: string | null
  adresseRue: string | null
  adresseVille: string | null
  adressePays: string | null
  createdAt: string
  updatedAt: string
}

export interface PatientProfileRequest {
  dateNaissance?: string | null
  genre?: string | null
  nationalite?: string | null
  numIdentite?: string | null
  photoUrl?: string | null
  telephone?: string | null
  adresseRue?: string | null
  adresseVille?: string | null
  adressePays?: string | null
}

// ── Messaging ────────────────────────────────────────────────────────────────

export type MessageType = 'TEXT' | 'AUDIO' | 'DOCUMENT'

export interface Message {
  id: string
  conversationId: string
  senderId: string
  messageType?: MessageType          // défaut TEXT si absent (rétrocompat)
  content: string | null
  mediaUrl?: string | null           // AUDIO/DOCUMENT : chemin protégé (auth requise)
  mediaDurationSec?: number | null   // AUDIO : durée en secondes
  mediaFilename?: string | null      // DOCUMENT : nom d'origine
  mediaSize?: number | null          // DOCUMENT : taille en octets
  sentAt: string
  readAt: string | null
}

export interface Conversation {
  id: string
  medecinId: string
  patientId: string
  medecinName: string
  patientName: string
  lastMessageAt: string | null
  createdAt: string
  unreadCount: number
  patientCanReply: boolean           // le médecin peut couper les réponses du patient
  lastMessage: Message | null
}

// ── Booking ──────────────────────────────────────────────────────────────────

export interface BookingSlot {
  medecin: MedecinProfile
  date: string   // "YYYY-MM-DD"
  debut: string  // "HH:mm"
  fin: string    // "HH:mm"
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
  content: PatientSummary[]
  total: number
  page: number
  size: number
}

// ── Compte famille (proches) ────────────────────────────────────────────────

export type RoleGestion = 'PARENT' | 'TUTEUR' | 'AIDANT' | 'REPRESENTANT_LEGAL'

export interface Proche {
  id: string
  nom: string
  prenom: string
  dateNaissance: string | null   // "YYYY-MM-DD"
  lieuNaissance?: string | null
  email?: string | null
  telephone?: string | null
  mineur: boolean
  self: boolean                  // true = le titulaire du compte lui-même
  role: RoleGestion | null
  declarationRepresentantLegal: boolean | null
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
