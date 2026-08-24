import type { DisponibiliteFilter } from '@/lib/disponibilite'
import type { SortKey } from './components/ResultsToolbar'

export const BOOKING_PARAM_KEYS = [
  'bookMedecinId',
  'bookDate',
  'bookDebut',
  'bookFin',
] as const

export interface RechercheState {
  specialite: string
  ville: string
  filter: DisponibiliteFilter
  date: string | null
  sort: SortKey
  nearbyMode: boolean
  page: number
  coords: { lat: number; lng: number } | null
}

interface BuildRechercheUrlOptions {
  readonly removeBookingParams?: boolean
}

function disponibiliteValide(value: string | null): DisponibiliteFilter {
  return value === 'today' || value === 'week' ? value : 'all'
}

function dateValide(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  const [year, month, day] = value.split('-').map(Number)
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day
    ? value
    : null
}

function triValide(value: string | null): SortKey {
  return value === 'nom' || value === 'distance' ? value : 'pertinence'
}

function pageValide(value: string | null): number {
  const page = Number.parseInt(value ?? '', 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

/** Lit l'état partageable de la recherche depuis l'URL. */
export function readRechercheState(params: Pick<URLSearchParams, 'get'>): RechercheState {
  const lat = Number(params.get('lat'))
  const lng = Number(params.get('lng'))
  const coords =
    Number.isFinite(lat) && Number.isFinite(lng) && params.get('lat') && params.get('lng')
      ? { lat, lng }
      : null

  return {
    specialite: params.get('specialite') ?? '',
    ville: params.get('ville') ?? '',
    filter: disponibiliteValide(params.get('disponibilite')),
    date: dateValide(params.get('date')),
    sort: triValide(params.get('tri')),
    nearbyMode: params.get('nearby') === '1' && coords !== null,
    page: pageValide(params.get('page')),
    coords,
  }
}

function setOrDelete(params: URLSearchParams, key: string, value: string, defaultValue = '') {
  if (value && value !== defaultValue) params.set(key, value)
  else params.delete(key)
}

/**
 * Sérialise tous les contrôles qui définissent la liste visible.
 *
 * Les paramètres inconnus sont conservés afin de ne pas casser le retour de
 * connexion ou de réservation. Ils peuvent être retirés explicitement à la
 * fermeture du tiroir.
 */
export function buildRechercheUrl(
  currentParams: Pick<URLSearchParams, 'toString'>,
  state: RechercheState,
  options: BuildRechercheUrlOptions = {},
): string {
  const params = new URLSearchParams(currentParams.toString())

  if (options.removeBookingParams) {
    BOOKING_PARAM_KEYS.forEach((key) => params.delete(key))
  }

  setOrDelete(params, 'specialite', state.specialite.trim())
  setOrDelete(params, 'ville', state.ville.trim())
  setOrDelete(params, 'disponibilite', state.filter, 'all')
  setOrDelete(params, 'date', state.date ?? '')
  setOrDelete(params, 'tri', state.sort, 'pertinence')
  setOrDelete(params, 'page', state.page > 1 ? String(state.page) : '')

  if (state.nearbyMode && state.coords) {
    params.set('nearby', '1')
    params.set('lat', String(state.coords.lat))
    params.set('lng', String(state.coords.lng))
  } else {
    params.delete('nearby')
    params.delete('lat')
    params.delete('lng')
  }

  const query = params.toString()
  return query ? `/recherche?${query}` : '/recherche'
}
