'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HelpCircle, UserRound } from 'lucide-react'
import { getSession, type Session } from '@/lib/session'
import { logout } from '@/lib/auth'
import Logo from '@/components/Logo'

export function Header({ sticky = true }: { sticky?: boolean }) {
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()

  useEffect(() => {
    setSession(getSession())
    function sync() { setSession(getSession()) }
    window.addEventListener('session-updated', sync)
    return () => window.removeEventListener('session-updated', sync)
  }, [])

  function handleLogout() {
    void logout()
  }

  const dashboardHref =
    session?.role === 'MEDECIN'
      ? '/dashboard/medecin'
      : session?.role === 'ADMIN'
        ? '/dashboard/admin'
        : '/dashboard/patient'

  return (
    <header className={`${sticky ? 'sticky top-0' : ''} z-50 bg-[#EBF4FF] shadow-sm`}>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 md:px-8">

        {/* Logo */}
        <Logo className="h-9 w-auto" priority />

        {/* Right nav */}
        <div className="flex items-center gap-4 md:gap-6">

          {/* "Vous êtes soignant?" */}
          <Link
            href="/inscription?role=medecin"
            className="hidden md:inline-flex items-center justify-center rounded-md bg-[#007DFF] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#00263C]"
          >
            Vous êtes soignant ?
          </Link>

          {/* Centre d'aide */}
          <Link
            href="/aide"
            className="hidden md:inline-flex items-center justify-center text-[#465058] hover:text-[#007DFF] transition-colors text-sm font-medium"
          >
            <HelpCircle className="h-4 w-4 mr-1.5" />
            Centre d&apos;aide
          </Link>

          {/* Auth */}
          {!session ? (
            <a
              href="/login"
              className="inline-flex items-center text-[#007DFF] hover:text-[#00263C] transition-colors"
            >
              <UserRound className="mr-2 h-5 w-5" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold leading-tight">Se connecter</span>
                <span className="text-[11px] leading-tight font-normal opacity-70">Gérer mes RDV</span>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href={dashboardHref}
                className="inline-flex items-center text-[#007DFF] hover:text-[#00263C] transition-colors"
              >
                {session.photoUrl ? (
                  <img
                    src={session.photoUrl}
                    alt="Avatar"
                    className="mr-2 h-8 w-8 rounded-full object-cover border-2 border-[#007DFF]/30 flex-shrink-0"
                  />
                ) : (
                  <UserRound className="mr-2 h-5 w-5" />
                )}
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold leading-tight">
                    {session.firstName ?? 'Mon espace'}
                  </span>
                  <span className="text-[11px] leading-tight font-normal opacity-70">
                    {session.role === 'MEDECIN' ? 'Mon Agenda' : 'Mes RDV'}
                  </span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden md:block text-xs font-medium text-[#465058] hover:text-[#007DFF] transition-colors"
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
