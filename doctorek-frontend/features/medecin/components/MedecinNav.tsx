'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/dashboard/medecin', label: 'Accueil' },
  { href: '/dashboard/medecin/agenda', label: 'Agenda' },
  { href: '/dashboard/medecin/patients', label: 'Patients' },
  { href: '/dashboard/medecin/disponibilites', label: 'Disponibilités' },
  { href: '/dashboard/medecin/profil', label: 'Profil' },
]

export function MedecinNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-4">
        {LINKS.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
