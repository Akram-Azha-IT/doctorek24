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
 * Ends both the Auth.js session and the Keycloak SSO session.
 * Everything happens on /logged-out (a page with no auth guards, so no
 * redirect race): it clears the local session FIRST — guaranteeing the user
 * is logged out on the first click even if Keycloak's SSO session already
 * expired (stale id_token_hint makes Keycloak error out without redirecting) —
 * then navigates to the Keycloak end-session endpoint, which returns to
 * /logged-out?done=1 and finally lands on /login.
 */
export async function logout(): Promise<void> {
  window.location.href = '/logged-out'
}
