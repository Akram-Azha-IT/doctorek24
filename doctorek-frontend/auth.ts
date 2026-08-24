import NextAuth from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'

type Role = 'ADMIN' | 'MEDECIN' | 'PATIENT'

const ROLE_PRIORITY: Record<Role, number> = { ADMIN: 3, MEDECIN: 2, PATIENT: 1 }

/** Keycloak's realm_access.roles can carry several roles (or none); pick the most privileged known one. */
function pickRole(roles: string[] | undefined): Role {
  const known = (roles ?? []).filter((r): r is Role => r in ROLE_PRIORITY)
  if (known.length === 0) return 'PATIENT'
  return known.sort((a, b) => ROLE_PRIORITY[b] - ROLE_PRIORITY[a])[0]
}

interface KeycloakTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
}

interface CurrentUserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  avatarUrl?: string | null
}

/**
 * The Keycloak JWT subject is NOT the app's local user id — the backend's resources
 * (patients, cartes, rdvs...) are keyed by the local DB UUID. Bridge the two via /auth/me.
 */
async function fetchCurrentUser(accessToken: string): Promise<CurrentUserResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) return null
  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      // The local profile enriches the session but must never block the OAuth
      // callback indefinitely when the backend or its database is unavailable.
      signal: AbortSignal.timeout(4_000),
    })
    if (!res.ok) return null
    const body = await res.json()
    return body.data as CurrentUserResponse
  } catch {
    return null
  }
}

async function refreshKeycloakToken(refreshToken: string): Promise<KeycloakTokenResponse> {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER
  if (!issuer) throw new Error('AUTH_KEYCLOAK_ISSUER is not configured')

  const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(5_000),
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.AUTH_KEYCLOAK_ID ?? '',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) throw new Error(`Keycloak refresh_token grant failed (${res.status})`)
  return res.json()
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
      // Public client (PKCE only, no client secret) — matches the "doctorek-frontend"
      // Keycloak client configured with Standard Flow + PKCE-S256.
      client: { token_endpoint_auth_method: 'none' },
    }),
  ],
  session: { strategy: 'jwt' },
  // Remplace la page d'erreur Auth.js par défaut (anglaise, technique) par une
  // page française rassurante. Auth.js y redirige avec ?error=<code>.
  pages: { error: '/connexion-erreur' },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign-in: account/profile are only present right after the Keycloak callback.
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.idToken = account.id_token
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined

        const currentUser = account.access_token ? await fetchCurrentUser(account.access_token) : null
        if (currentUser) {
          token.userId = currentUser.id
          token.role = currentUser.role
          token.firstName = currentUser.firstName
          token.lastName = currentUser.lastName
          token.avatarUrl = currentUser.avatarUrl ?? (profile?.picture as string | undefined)
        } else {
          // Fallback (backend unreachable, or account not yet linked to Keycloak) —
          // keeps the Keycloak subject so the session isn't entirely empty.
          const realmAccess = profile?.realm_access as { roles?: string[] } | undefined
          token.role = pickRole(realmAccess?.roles)
          token.userId = profile?.sub ?? undefined
          token.firstName = profile?.given_name as string | undefined
          token.lastName = profile?.family_name as string | undefined
          token.avatarUrl = profile?.picture as string | undefined
        }
        delete token.error
        return token
      }

      // Subsequent calls: keep the token as-is while it still has a comfortable margin.
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number) - 60_000) {
        return token
      }

      if (!token.refreshToken) {
        token.error = 'RefreshFailed'
        return token
      }

      try {
        const refreshed = await refreshKeycloakToken(token.refreshToken as string)
        token.accessToken = refreshed.access_token
        token.refreshToken = refreshed.refresh_token ?? token.refreshToken
        token.accessTokenExpires = Date.now() + refreshed.expires_in * 1000
        delete token.error
      } catch {
        token.error = 'RefreshFailed'
      }

      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      session.error = token.error as string | undefined
      session.user.id = token.userId as string
      session.user.role = token.role as Role
      session.user.firstName = token.firstName as string | undefined
      session.user.lastName = token.lastName as string | undefined
      session.user.avatarUrl = token.avatarUrl as string | undefined
      return session
    },
  },
  trustHost: true,
})
