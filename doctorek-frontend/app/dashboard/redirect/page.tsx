'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import LogoLoader from '@/components/LogoLoader'

/**
 * Landing spot for signIn('keycloak') when no explicit ?redirect= was set.
 * Routes to the right dashboard once the Auth.js session resolves.
 */
export default function DashboardRedirectPage() {
  const { data, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Defensive: if this page ever ends up framed, escape so the dashboard owns the full tab.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.self !== window.top && window.top) {
      window.top.location.href = window.location.href
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return

    if (status !== 'authenticated' || !data?.user || data.error) {
      // /login 307s to Keycloak (cross-origin) — needs a full browser navigation.
      window.location.replace('/login')
      return
    }

    // A pre-login intent (e.g. continuing a booking) is carried as ?next= — honor it over the
    // default role dashboard. Only same-origin relative paths are allowed.
    const next = searchParams.get('next')
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      router.replace(next)
      return
    }

    if (data.user.role === 'MEDECIN') router.replace('/dashboard/medecin')
    else if (data.user.role === 'ADMIN') router.replace('/dashboard/admin')
    else router.replace('/dashboard/patient')
  }, [status, data, router, searchParams])

  return <LogoLoader fullScreen width={140} label="Ouverture de votre espace…" />
}
