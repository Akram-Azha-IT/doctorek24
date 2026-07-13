import { NextResponse } from 'next/server'
import { auth } from '@/auth'

// Next.js 16 renamed Middleware to Proxy (same runtime, same file-convention rules) —
// this is the server-side, no-flash guard for /dashboard/**. Role correctness within
// /dashboard is still checked client-side (useRoleGuard) and enforced for real by the
// backend's @PreAuthorize — this is an optimistic check only, per Next.js's own guidance.
const PROTECTED_PREFIXES = ['/dashboard']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isProtected && !req.auth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: ['/dashboard/:path*'],
}
