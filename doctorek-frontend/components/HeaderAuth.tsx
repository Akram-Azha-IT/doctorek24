'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSession, clearSession, type Session } from '@/lib/session'

export function HeaderAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()

  useEffect(() => {
    setSession(getSession())
  }, [])

  function handleLogout() {
    clearSession()
    setSession(null)
    router.push('/')
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-blue-600 px-4 py-1.5 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Connexion
      </Link>
    )
  }

  const dashboardHref =
    session.role === 'MEDECIN' ? '/dashboard/medecin' : '/patient/rdvs'
  const displayName =
    session.firstName
      ? `${session.firstName}${session.lastName ? ' ' + session.lastName : ''}`
      : session.email

  return (
    <div className="flex items-center gap-3">
      <Link
        href={dashboardHref}
        className="text-sm text-zinc-700 hover:text-zinc-900 transition-colors"
      >
        {displayName}
      </Link>
      <button
        onClick={handleLogout}
        className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
      >
        Deconnexion
      </button>
    </div>
  )
}
