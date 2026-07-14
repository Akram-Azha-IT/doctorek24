import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * RP-initiated logout: builds the Keycloak end_session_endpoint URL so the client
 * can terminate the Keycloak SSO session too, not just the local Auth.js cookie.
 * Reads the raw JWT (not the public session) so the id_token never reaches the client session object.
 */
export async function GET(req: NextRequest) {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER
  if (!issuer) {
    return NextResponse.json({ url: null })
  }

  // Behind the TLS proxy the request looks like http://, but the browser stores
  // the session under the __Secure- cookie name — force secure cookie lookup.
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: (process.env.AUTH_URL ?? '').startsWith('https'),
  })

  // Behind a TLS-terminating proxy req.url is http:// — build the public URL
  // from AUTH_URL so Keycloak's registered post-logout redirect matches.
  const baseUrl = process.env.AUTH_URL ?? req.url
  const params = new URLSearchParams({
    post_logout_redirect_uri: new URL('/logged-out', baseUrl).toString(),
  })
  if (typeof token?.idToken === 'string') {
    params.set('id_token_hint', token.idToken)
  }
  if (process.env.AUTH_KEYCLOAK_ID) {
    params.set('client_id', process.env.AUTH_KEYCLOAK_ID)
  }

  return NextResponse.json({ url: `${issuer}/protocol/openid-connect/logout?${params.toString()}` })
}
