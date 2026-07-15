'use client'

import { useEffect } from 'react'
import { signOut as nextAuthSignOut } from 'next-auth/react'
import { clearSession } from '@/lib/session'

/**
 * Single logout pipeline (no auth guards here, so no redirect races):
 * 1. First visit: fetch the Keycloak end-session URL while the Auth.js cookie
 *    still exists (it carries the id_token_hint), THEN clear the local session —
 *    the user is logged out locally on the first click no matter what Keycloak does.
 * 2. Navigate to Keycloak, which redirects back here with ?done=1.
 * 3. ?done=1 (or no Keycloak URL): finish on /login.
 * If Keycloak's SSO session already expired and it shows an error instead of
 * redirecting, the local session is dead anyway — the user is logged out.
 */
export default function LoggedOutPage() {
  useEffect(() => {
    let cancelled = false
    async function cleanup() {
      const alreadyDone = new URLSearchParams(window.location.search).has('done')

      let endSessionUrl: string | null = null
      if (!alreadyDone) {
        try {
          const res = await fetch('/api/auth/federated-logout')
          const body = await res.json()
          endSessionUrl = body.url ?? null
        } catch {
          // Keycloak unreachable — local cleanup below still logs the user out.
        }
      }

      clearSession()
      try {
        await nextAuthSignOut({ redirect: false })
      } catch {
        // cookie may already be gone — proceed to login regardless
      }

      if (cancelled) return
      if (!alreadyDone && endSessionUrl) {
        window.location.replace(endSessionUrl)
      } else {
        window.location.replace('/login')
      }
    }
    void cleanup()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
      <div className="flex flex-col items-center gap-3">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#007DFF]/30 border-t-[#007DFF]" />
        <p className="text-sm text-[#465058]">Déconnexion en cours…</p>
      </div>
    </div>
  )
}
