import { afterEach, describe, expect, it } from 'vitest'

import { getKeycloakBrowserIssuer } from './keycloak-url'

const originalIssuer = process.env.AUTH_KEYCLOAK_ISSUER
const originalPublicUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL

afterEach(() => {
  process.env.AUTH_KEYCLOAK_ISSUER = originalIssuer
  process.env.NEXT_PUBLIC_KEYCLOAK_URL = originalPublicUrl
})

describe('getKeycloakBrowserIssuer', () => {
  it('keeps the canonical realm path while using the browser-facing host', () => {
    process.env.AUTH_KEYCLOAK_ISSUER = 'http://localhost:9080/realms/doctorek'
    process.env.NEXT_PUBLIC_KEYCLOAK_URL = 'http://127.0.0.1:9080'

    expect(getKeycloakBrowserIssuer()).toBe('http://127.0.0.1:9080/realms/doctorek')
  })

  it('falls back to the canonical issuer when no public URL is configured', () => {
    process.env.AUTH_KEYCLOAK_ISSUER = 'https://auth.doctorek.ma/realms/doctorek/'
    delete process.env.NEXT_PUBLIC_KEYCLOAK_URL

    expect(getKeycloakBrowserIssuer()).toBe('https://auth.doctorek.ma/realms/doctorek')
  })
})
