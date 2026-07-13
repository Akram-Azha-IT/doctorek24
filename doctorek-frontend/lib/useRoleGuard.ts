'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export function useRoleGuard(requiredRole: 'MEDECIN' | 'PATIENT' | 'ADMIN') {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return // Auth.js still resolving — avoid a premature redirect

    // session.error === 'RefreshFailed' → the access token is dead and can't be renewed.
    // Treat it the same as being unauthenticated.
    if (status === 'unauthenticated' || !session?.user || session.error) {
      // /login is a route handler that 307s to Keycloak (cross-origin) — a client
      // router navigation would first attempt an RSC fetch that fails on CORS.
      // Full browser navigation follows the redirect chain cleanly.
      window.location.replace('/login')
      return
    }

    if (session.user.role !== requiredRole) {
      if (session.user.role === 'ADMIN') router.replace('/dashboard/admin')
      else if (session.user.role === 'MEDECIN') router.replace('/dashboard/medecin')
      else router.replace('/dashboard/patient')
    }
  }, [status, session, router, requiredRole])
}
