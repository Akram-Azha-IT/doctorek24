import { getSession, saveSession, clearSession, type Session } from './session'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

interface BackendLoginResponse {
  success: boolean
  data?: {
    accessToken: string
    refreshToken: string | null
    userId: string
    role: string
    firstName: string
    lastName: string
    email: string
  }
  error?: string
}

export interface LoginResult {
  accessToken: string
  session: Session
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const body = await res.json().catch(() => null) as BackendLoginResponse | null

  if (!res.ok || !body?.success || !body.data) {
    throw new Error(body?.error ?? 'Identifiants incorrects')
  }

  const { accessToken, refreshToken, userId, role, firstName, lastName, email: userEmail } = body.data

  const session: Session = {
    id: userId,
    email: userEmail,
    role: role as Session['role'],
    firstName,
    lastName,
    accessToken,
    refreshToken,
  }

  saveSession(session)
  return { accessToken, session }
}

export function logout(): void {
  clearSession()
}

/** Decode JWT expiry without any library. Returns Unix seconds, or null on failure. */
export function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  const session = getSession()
  if (!session?.refreshToken) return false
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
    if (!res.ok) return false
    const body = await res.json().catch(() => null)
    if (!body?.success || !body?.data?.accessToken) return false
    saveSession({ ...session, accessToken: body.data.accessToken })
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('session-updated'))
    return true
  } catch {
    return false
  }
}
