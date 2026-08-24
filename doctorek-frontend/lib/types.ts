export interface AppNotification {
  id: string
  /**
   * Types connus du client. Le `string & {}` garde l'autocomplétion des libellés
   * ci-dessus sans fermer la liste : le serveur peut émettre un type plus récent
   * que cette version du front, qui doit alors s'afficher au lieu de casser.
   */
  type:
    | 'CARTE_CREEE'
    | 'MESSAGE_RECU'
    | 'ANNIVERSAIRE'
    | 'DOCUMENT_RECU'
    | 'RDV_RAPPEL'
    | 'AVIS_INVITATION'
    | (string & {})
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
  /** Consentement loi 09-08 : le serveur refuse la création du compte sans lui. */
  consentementDonnees: boolean
  lang?: string
}

/** État du consentement de l'utilisateur connecté (loi 09-08). */
export interface ConsentementStatut {
  requis: boolean
  version: string
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
  medecinPhotoUrl: string | null
  patientPhotoUrl: string | null
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

/** Inscription d'un patient en liste d'attente chez un médecin. */
export interface ListeAttente {
  id: string
  medecinId: string
  patientId: string
  dateDebut: string
  dateFin: string
  statut: 'ACTIVE' | 'SERVIE' | 'ANNULEE'
  createdAt: string
}

/** Membre du foyer d'un patient, tel que renvoyé au médecin. */
export interface FamilleMembre {
  patientId: string
  firstName: string
  lastName: string
  photoUrl: string | null
  gestionnaireId: string | null
  gestionnaireNom: string | null
}

export interface PatientSummary {
  patientId: string
  firstName: string
  lastName: string
  photoUrl: string | null
  /** Renseignés quand le patient est un proche rattaché à un compte titulaire. */
  gestionnaireId: string | null
  gestionnaireNom: string | null
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
  /** Renseigné quand un tiers a réservé (titulaire pour un proche, ou le médecin). */
  creeParNom?: string | null
  questionnaire?: QuestionnairePreConsult | null
  createdAt: string
}

// ── Avis sur les médecins ───────────────────────────────────────────────────

export type StatutAvis = 'PUBLIE' | 'SIGNALE' | 'MASQUE'

export interface Avis {
  id: string
  note: number
  commentaire: string | null
  /** Libellé calculé côté serveur : « Akram B. » ou « Patient vérifié ». */
  auteur: string
  anonyme: boolean
  statut: StatutAvis
  createdAt: string
}

/**
 * Note agrégée d'un médecin, pour les cartes de résultats.
 *
 * Un médecin sans avis n'a pas d'entrée : l'absence est l'information, une moyenne
 * de 0 se lirait comme une mauvaise note.
 */
export interface NoteMedecin {
  medecinId: string
  noteMoyenne: number
  nombreAvis: number
}

export interface AvisPage {
  content: Avis[]
  totalElements: number
  totalPages: number
  page: number
  size: number
  /** null quand le médecin n'a encore aucun avis — à ne pas confondre avec 0. */
  noteMoyenne: number | null
  nombreAvis: number
  /** Compteurs des notes 1 à 5, dans cet ordre. */
  repartition: number[]
}

/* ─────────────────────────────────────────────────────────────────────────────
   Assistant conversationnel (module agent)

   Le texte est écrit par le modèle ; les cartes viennent du retour réel des
   services métier. C'est cette séparation qui garantit qu'un nom de praticien
   ou un horaire affiché ne peut pas être inventé.
   ──────────────────────────────────────────────────────────────────────────── */

export type AgentCardType = 'medecins' | 'medecin' | 'creneaux' | 'rdvs' | 'brouillon'

export interface AgentCard {
  type: AgentCardType
  donnees: unknown
}

export interface AgentChatResponse {
  conversationId: string
  texte: string
  cartes: AgentCard[]
  outilsAppeles: string[]
}

export interface AgentMedecinCarte {
  profil: MedecinProfile
  noteMoyenne: number | null
  nombreAvis: number | null
  distanceKm: number | null
}

export interface AgentJourCreneaux {
  date: string
  creneaux: Creneau[]
}

export interface AgentCreneauxCarte {
  /** Profil complet : le tiroir de réservation l'attend tel quel au clic sur un créneau. */
  medecin: MedecinProfile
  jours: AgentJourCreneaux[]
}

/** Proposition de rendez-vous : rien n'est réservé tant que le patient n'a pas confirmé. */
export interface AgentRdvBrouillon {
  medecinId: string
  medecinNom: string
  patientId: string | null
  date: string
  heure: string
  dureeMinutes: number
  motif: string | null
  creneauLibre: boolean
  indisponibilite: string | null
}

/** Un tour affiché dans le fil. Les cartes n'existent que côté assistant. */
export interface AgentTour {
  id: string
  role: 'patient' | 'assistant'
  texte: string
  cartes?: AgentCard[]
  outils?: string[]
  erreur?: boolean
}
