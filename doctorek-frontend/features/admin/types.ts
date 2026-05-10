export interface AdminStats {
  totalPatients: number
  totalMedecins: number
  totalRdvs: number
  rdvsAujourdhui: number
  rdvsEnAttente: number
  totalCartes: number
}

export interface CarteSummary {
  id: string
  patientId: string
  cardRef: string
  statut: string
  groupeSanguin: string | null
  adresseVille: string | null
  adressePays: string | null
  donneurOrganes: boolean | null
  createdAt: string
}

export interface CartesPage {
  cartes: CarteSummary[]
  total: number
  page: number
  size: number
}

export interface UserSummary {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  specialite: string | null
  ville: string | null
  active: boolean
  emailVerified: boolean
  createdAt: string
  hasCarteVirtuelle: boolean
}

export interface UsersPage {
  users: UserSummary[]
  total: number
  page: number
  size: number
}
