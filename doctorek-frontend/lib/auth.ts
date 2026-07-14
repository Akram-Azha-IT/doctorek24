'use client'

import { getSession as getAuthSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { __setCachedSession, clearSession, type Session } from './session'

function mapToSession(authSession: Awaited<ReturnType<typeof getAuthSession>>): Session | null {
  if (!authSession?.user) return null
  return {
    role: authSession.user.role,
    id: authSession.user.id,
    email: authSession.user.email ?? '',
    accessToken: authSession.accessToken,
    refreshToken: null,
  }
}

/**
 * Forces Auth.js to re-evaluate the session, which re-runs the jwt() callback in auth.ts —
 * that's where the Keycloak refresh_token grant happens if the access token is close to expiry.
 * Mirrors the (possibly refreshed) result into the sync cache used across the app.
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const authSession = await getAuthSession()
    const session = mapToSession(authSession)
    if (!session?.accessToken) return false
    __setCachedSession(session)
    return true
  } catch {
    return false
  }
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

/**
 * Ends both the Keycloak SSO session and the Auth.js session.
 * Order matters: navigate to Keycloak FIRST while the local session is still
 * alive — killing it here would trigger the layout auth guards, whose
 * redirect races (and cancels) the end-session navigation. Keycloak then
 * redirects to /logged-out, which clears the local session and lands on /login.
 */
export async function logout(): Promise<void> {
  let endSessionUrl: string | null = null
  try {
    const res = await fetch('/api/auth/federated-logout')
    const body = await res.json()
    endSessionUrl = body.url ?? null
  } catch {
    // Keycloak unreachable — fall back to the local cleanup page directly.
  }
  window.location.href = endSessionUrl ?? '/logged-out'
}
