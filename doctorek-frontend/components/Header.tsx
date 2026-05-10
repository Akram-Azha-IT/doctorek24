'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { HelpCircle, UserRound } from 'lucide-react'
import { getSession, clearSession, type Session } from '@/lib/session'

export function Header() {
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()

  useEffect(() => {
    setSession(getSession())
    function sync() { setSession(getSession()) }
    window.addEventListener('session-updated', sync)
    return () => window.removeEventListener('session-updated', sync)
  }, [])

  function handleLogout() {
    clearSession()
    setSession(null)
    router.push('/')
  }

  const dashboardHref = session?.role === 'MEDECIN' ? '/dashboard/medecin' : '/dashboard/patient'

  return (
    <header className="sticky top-0 z-50 bg-[#007DFF] shadow-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 md:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className="bg-white rounded-xl px-3 py-1.5">
            <Image
              src="/logo0.png"
              alt="Doctorek"
              width={130}
              height={44}
              className="h-9 w-auto"
              priority
            />
          </div>
        </Link>

        {/* Right nav */}
        <div className="flex items-center gap-4 md:gap-6">

          {/* "Vous êtes soignant?" */}
          <Link
            href="/inscription?role=medecin"
            className="hidden md:inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-bold text-[#00263C] transition-colors hover:bg-gray-50"
          >
            Vous êtes soignant ?
          </Link>

          {/* Centre d'aide */}
          <Link
            href="/aide"
            className="hidden md:inline-flex items-center justify-center text-white hover:text-blue-100 transition-colors text-sm font-semibold"
          >
            <HelpCircle className="h-4 w-4 mr-1.5" />
            Centre d&apos;aide
          </Link>

          {/* Auth */}
          {!session ? (
            <Link
              href="/login"
              className="inline-flex items-center text-white hover:text-blue-100 transition-colors"
            >
              <UserRound className="mr-2 h-5 w-5" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold leading-tight">Se connecter</span>
                <span className="text-[11px] leading-tight font-normal opacity-90">Gérer mes RDV</span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href={dashboardHref}
                className="inline-flex items-center text-white hover:text-blue-100 transition-colors"
              >
                {session.photoUrl ? (
                  <img
                    src={session.photoUrl}
                    alt="Avatar"
                    className="mr-2 h-8 w-8 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
                  />
                ) : (
                  <UserRound className="mr-2 h-5 w-5" />
                )}
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold leading-tight">
                    {session.firstName ?? 'Mon espace'}
                  </span>
                  <span className="text-[11px] leading-tight font-normal opacity-90">
                    {session.role === 'MEDECIN' ? 'Mon Agenda' : 'Mes RDV'}
                  </span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden md:block text-xs font-medium text-white/70 hover:text-white transition-colors"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
