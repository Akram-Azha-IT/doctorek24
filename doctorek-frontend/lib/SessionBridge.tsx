'use client'

import { useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { __setCachedSession } from './session'

/**
 * Mounted once near the app root. Mirrors the Auth.js session (cookie-backed, reactive via
 * useSession) into the synchronous lib/session.ts cache that the rest of the app reads.
 */
export function SessionBridge() {
  const { data, status } = useSession()
  const signingOut = useRef(false)

  useEffect(() => {
    if (status === 'loading') return

    // A session whose Keycloak refresh failed is effectively dead: the access token can no
    // longer be renewed, so every API call returns nothing. Treat it as logged out instead of
    // mirroring a logged-in shell that shows no data.
    if (status === 'authenticated' && data?.user && !data.error) {
      __setCachedSession({
        role: data.user.role,
        id: data.user.id,
        email: data.user.email ?? '',
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        photoUrl: data.user.avatarUrl ?? null,
        accessToken: data.accessToken,
        refreshToken: null,
      })
      return
    }

    __setCachedSession(null)

    // Clear the stale Auth.js cookie once so we don't keep resurrecting a dead session.
    if (status === 'authenticated' && data?.error && !signingOut.current) {
      signingOut.current = true
      void signOut({ redirect: false })
    }
  }, [status, data])

  return null
}
