/**
 * Auth.js must keep the canonical issuer used in Keycloak tokens, while the browser may need a
 * different loopback host in development (for example when WSL captures localhost/IPv6).
 */
export function getKeycloakBrowserIssuer(): string | null {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER
  if (!issuer) return null

  const publicBase = process.env.NEXT_PUBLIC_KEYCLOAK_URL
  if (!publicBase) return issuer.replace(/\/$/, '')

  try {
    const issuerUrl = new URL(issuer)
    const browserUrl = new URL(publicBase)
    browserUrl.pathname = issuerUrl.pathname
    browserUrl.search = ''
    browserUrl.hash = ''
    return browserUrl.toString().replace(/\/$/, '')
  } catch {
    return issuer.replace(/\/$/, '')
  }
}
