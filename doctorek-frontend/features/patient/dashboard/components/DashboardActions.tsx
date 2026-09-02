'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarDays, FileText, Search, Sparkles, Stethoscope } from 'lucide-react'
import { openAgent } from '@/features/agent/events'

const ACTIONS = [
  {
    href: '/recherche',
    label: 'Trouver un médecin',
    description: 'Par spécialité ou par ville',
    icon: Stethoscope,
  },
  {
    href: '/dashboard/patient/rdvs',
    label: 'Mes rendez-vous',
    description: 'Voir, modifier ou annuler',
    icon: CalendarDays,
  },
  {
    href: '/dashboard/patient/dossier',
    label: 'Mes documents',
    description: 'Ordonnances et résultats',
    icon: FileText,
  },
] as const

export function DashboardActions() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    router.push(value ? `/recherche?specialite=${encodeURIComponent(value)}` : '/recherche')
  }

  return (
    <section className="rounded-[22px] border border-[#DCE7F3] bg-white p-4 shadow-[0_8px_28px_rgba(0,38,60,0.05)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center rounded-xl border border-[#C8D7E6] bg-white focus-within:border-[#007DFF] focus-within:ring-2 focus-within:ring-[#007DFF]/10">
          <Search className="ml-3.5 h-5 w-5 shrink-0 text-[#6C7F93]" aria-hidden="true" />
          <label htmlFor="dashboard-doctor-search" className="sr-only">Rechercher un médecin ou une spécialité</label>
          <input
            id="dashboard-doctor-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Médecin ou spécialité"
            className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-[#010C2D] outline-none placeholder:text-[#8796A8]"
          />
          <button
            type="submit"
            className="mr-1 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#00263C] px-3.5 text-sm font-bold text-white transition-colors hover:bg-[#004063]"
          >
            Rechercher
            <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden="true" />
          </button>
        </form>

        <button
          type="button"
          onClick={openAgent}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#BFD9F2] bg-[#F4F9FF] px-4 text-sm font-bold text-[#005FBE] transition-colors hover:border-[#007DFF] hover:bg-[#EAF5FF]"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Être guidé
        </button>
      </div>

      <div className="mt-4 grid divide-y divide-[#E7EEF5] border-t border-[#E7EEF5] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 px-1 py-4 first:sm:pr-4 sm:px-4 sm:first:pl-1 sm:last:pr-1"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF6FF] text-[#007DFF] transition-colors group-hover:bg-[#007DFF] group-hover:text-white">
              <action.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#010C2D]">{action.label}</span>
              <span className="mt-0.5 block text-xs text-[#64758A]">{action.description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
