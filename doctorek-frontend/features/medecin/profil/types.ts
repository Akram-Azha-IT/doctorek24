export interface ProfilForm {
  firstName: string
  lastName: string
  phone: string
  specialite: string
  ville: string
  adresse: string
  lang: string
  latitude: number | null
  longitude: number | null
}

export type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
