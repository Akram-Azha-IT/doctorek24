import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// Next.js 16 renamed Middleware to Proxy (same runtime, same file-convention rules).
// Ce fichier cumule deux responsabilités :
//  1. Garde optimiste /dashboard/** (no-flash) — l'enforcement réel reste côté
//     backend (@PreAuthorize) + client (useRoleGuard).
//  2. CSP à base de nonce (durcissement post-scan DAST/ZAP).
//
// CSP nonce : un nonce unique par requête est exposé via `x-nonce` et posé dans
// l'en-tête Content-Security-Policy ; Next l'applique automatiquement à ses scripts
// (runtime React/Next, bundles de page, styles next/font). Cela impose le rendu
// dynamique (voir `export const dynamic = 'force-dynamic'` dans app/layout.tsx) —
// le SEO reste assuré (SSR complet), on perd seulement le cache statique/CDN.
//
// Compromis conservés (faible risque, documentés) :
//  - style-src 'unsafe-inline' : nombreux styles inline React (largeurs dynamiques,
//    SVG carte) ; l'injection de style n'exécute pas de code.
//  - img-src https: : avatars Google, tuiles OpenStreetMap, fichiers MinIO.
// Le gain clé est la suppression de 'unsafe-inline'/'unsafe-eval' sur script-src,
// seul vecteur XSS réel.

const PROTECTED_PREFIXES = ['/dashboard']

function originOf(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

const API_ORIGIN = originOf(process.env.NEXT_PUBLIC_API_URL)
const KEYCLOAK_ORIGIN = originOf(process.env.NEXT_PUBLIC_KEYCLOAK_URL)
// WebSocket STOMP : même hôte que l'API (wss en prod, ws en local).
const API_WS = API_ORIGIN ? API_ORIGIN.replace(/^http/, 'ws') : null

const CONNECT_SRC = [
  "'self'",
  API_ORIGIN,
  API_WS,
  KEYCLOAK_ORIGIN,
  'https://*.tile.openstreetmap.org',
  'https://countriesnow.space',
]
  .filter(Boolean)
  .join(' ')

const FORM_ACTION = ["'self'", KEYCLOAK_ORIGIN].filter(Boolean).join(' ')

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  return [
    "default-src 'self'",
    // strict-dynamic : seuls les scripts porteurs du nonce (et ceux qu'ils
    // chargent) s'exécutent. unsafe-eval uniquement en dev (React debug).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${CONNECT_SRC}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    `form-action ${FORM_ACTION}`,
    'upgrade-insecure-requests',
  ].join('; ')
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // 1. Garde /dashboard (avant toute chose : une redirection n'a pas besoin de CSP).
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (isProtected && !req.auth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. CSP nonce sur la réponse.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
})

export const config = {
  matcher: [
    {
      // Toutes les pages sauf API, assets statiques et favicon (pas de HTML → pas
      // de CSP nécessaire). Les prefetch next/link sont ignorés.
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
