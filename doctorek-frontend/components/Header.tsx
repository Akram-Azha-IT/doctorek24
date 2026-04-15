import Link from 'next/link'
import { HeaderAuth } from './HeaderAuth'

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/recherche" className="text-lg font-bold tracking-tight text-blue-600">
          Doctorek
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-zinc-600">
          <Link href="/recherche" className="hover:text-zinc-900 transition-colors">
            Rechercher
          </Link>
          <Link href="/dashboard/medecin" className="hover:text-zinc-900 transition-colors">
            Mon Agenda
          </Link>
          <Link href="/inscription" className="hover:text-zinc-900 transition-colors">
            S&apos;inscrire
          </Link>
          <HeaderAuth />
        </nav>
      </div>
    </header>
  )
}
