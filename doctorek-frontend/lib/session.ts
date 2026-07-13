export interface Session {
  role: 'MEDECIN' | 'PATIENT' | 'ADMIN'
  id: string
  email: string
  firstName?: string
  lastName?: string
  photoUrl?: string | null
  accessToken?: string
  refreshToken?: string | null
}

// Local UI enrichment only — first/last name + photo backfilled from app APIs after login.
// Never the source of truth for identity; that comes from the Auth.js/Keycloak session.
const ENRICHMENT_KEY = 'doctorek_profile_enrichment'

let cached: Session | null = null

function loadEnrichment(): Partial<Pick<Session, 'firstName' | 'lastName' | 'photoUrl'>> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(ENRICHMENT_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Internal — called only by SessionBridge to mirror the reactive Auth.js session into a
 * synchronously-readable cache. Keeps the existing getSession()/'session-updated' contract
 * that every consumer in the app already relies on, without forcing ~20 files to switch to
 * useSession() directly.
 */
export function __setCachedSession(base: Session | null): void {
  cached = base ? { ...base, ...loadEnrichment() } : null
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('session-updated'))
}

export function getSession(): Session | null {
  return cached
}

/** Local UI enrichment only (firstName/lastName/photoUrl) — never touches auth identity. */
export function saveSession(partial: Session): void {
  if (!cached) return
  cached = { ...cached, firstName: partial.firstName, lastName: partial.lastName, photoUrl: partial.photoUrl }
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      ENRICHMENT_KEY,
      JSON.stringify({ firstName: cached.firstName, lastName: cached.lastName, photoUrl: cached.photoUrl })
    )
    window.dispatchEvent(new Event('session-updated'))
  }
}

export function clearSession(): void {
  cached = null
  if (typeof window !== 'undefined') localStorage.removeItem(ENRICHMENT_KEY)
}
