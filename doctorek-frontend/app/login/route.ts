import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { signIn, auth } from '@/auth'

/**
 * Full-page redirect to the Keycloak-hosted login (Authorization Code + PKCE).
 * The Keycloak "doctorek" theme renders the complete branded login page —
 * no iframe, the whole tab navigates to Keycloak and back.
 *
 * Route handler (not a page): Auth.js signIn() must set the PKCE/state
 * cookies, which Server Components are not allowed to do.
 */
export async function GET(req: NextRequest) {
  const redirectParam = req.nextUrl.searchParams.get('redirect')

  // Route every post-login destination through /dashboard/redirect so the
  // role-based dispatch (and any ?next= booking intent) always runs.
  const callbackUrl = redirectParam
    ? `/dashboard/redirect?next=${encodeURIComponent(decodeURIComponent(redirectParam))}`
    : '/dashboard/redirect'

  // Already signed in → skip Keycloak, go straight to the role dispatcher.
  const session = await auth()
  if (session?.user && !session.error) redirect(callbackUrl)

  // Throws NEXT_REDIRECT → 302 chain to Keycloak's authorization endpoint.
  await signIn('keycloak', { redirectTo: callbackUrl })
}
