'use client'

import { useEffect } from 'react'
import { signOut as nextAuthSignOut } from 'next-auth/react'
import { clearSession } from '@/lib/session'

/**
 * Post-logout landing: Keycloak redirects here AFTER its SSO session is dead.
 * Only then do we clear the local Auth.js session — doing it before the
 * Keycloak navigation would let the dashboard auth guards race and cancel it.
 */
export default function LoggedOutPage() {
  useEffect(() => {
    let cancelled = false
    async function cleanup() {
      clearSession()
      try {
        await nextAuthSignOut({ redirect: false })
      } catch {
        // cookie may already be gone — proceed to login regardless
      }
      if (!cancelled) window.location.replace('/login')
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
