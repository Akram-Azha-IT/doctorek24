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

const KEY = 'doctorek_session'

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(KEY)
}
