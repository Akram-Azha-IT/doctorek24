'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, CreditCard, FileText, Calendar, Search, MessageCircle,
  LogOut, ChevronRight, LayoutDashboard,
} from 'lucide-react'
import { getSession } from '@/lib/session'
import { usePatientProfile } from '@/features/patient/hooks'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { logout } from '@/lib/auth'

interface MenuItem {
  href: string
  label: string
  desc: string
  icon: typeof Users
}

const FAMILLE: MenuItem[] = [
  { href: '/dashboard/patient/proches', label: 'Mes Proches', desc: 'Gérer les profils de votre famille', icon: Users },
]

const SANTE: MenuItem[] = [
  { href: '/dashboard/patient/carte', label: 'Carte Médicale', desc: 'Vos informations médicales essentielles', icon: CreditCard },
  { href: '/dashboard/patient/dossier', label: 'Mes Documents', desc: 'Ordonnances et documents partagés', icon: FileText },
]

const RACCOURCIS: MenuItem[] = [
  { href: '/dashboard/patient', label: 'Tableau de bord', desc: '', icon: LayoutDashboard },
  { href: '/dashboard/patient/rdvs', label: 'Mes Rendez-vous', desc: '', icon: Calendar },
  { href: '/dashboard/patient/messages', label: 'Messages', desc: '', icon: MessageCircle },
  { href: '/recherche', label: 'Trouver un médecin', desc: '', icon: Search },
]

export default function ComptePage() {
  useRoleGuard('PATIENT')
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [patientId, setPatientId] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    function sync() {
      const s = getSession()
      if (s) {
        setFirstName(s.firstName ?? '')
        setLastName(s.lastName ?? '')
        setPatientId(s.id ?? '')
        setPhotoUrl(s.photoUrl ?? null)
      }
    }
    sync()
    window.addEventListener('session-updated', sync)
    return () => window.removeEventListener('session-updated', sync)
  }, [])

  const { data: profile } = usePatientProfile(patientId || null)
  const resolvedPhoto = profile?.photoUrl ?? photoUrl
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Patient'
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || 'P'

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
      {/* Identité */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[#EDF1F5] bg-white p-5 shadow-sm">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#007DFF]/10 ring-2 ring-[#007DFF]/20">
          {resolvedPhoto ? (
            <img src={resolvedPhoto} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-[#007DFF]">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-[#010C2D]">{fullName}</p>
          <p className="text-sm text-[#465058]">Espace patient</p>
        </div>
      </div>

      <MenuSection title="Ma famille" items={FAMILLE} onNav={router.push} />
      <MenuSection title="Santé" items={SANTE} onNav={router.push} />
      <MenuSection title="Raccourcis" items={RACCOURCIS} onNav={router.push} compact />

      {/* Déconnexion — séparée, destructive */}
      <button
        type="button"
        onClick={() => void logout()}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-white px-4 py-4 text-[15px] font-bold text-[#E01E5A] shadow-sm transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E01E5A]/40 cursor-pointer"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
          <LogOut className="h-4 w-4" />
        </span>
        Déconnexion
      </button>
    </div>
  )
}

function MenuSection({
  title,
  items,
  onNav,
  compact,
}: {
  title: string
  items: MenuItem[]
  onNav: (href: string) => void
  compact?: boolean
}) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-[#EDF1F5] bg-white shadow-sm divide-y divide-zinc-100">
        {items.map((item) => (
          <button
            key={item.href}
            type="button"
            onClick={() => onNav(item.href)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F7FAFD] active:bg-[#F1F4F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#007DFF]/40 cursor-pointer"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EBF4FF]">
              <item.icon className="h-[18px] w-[18px] text-[#007DFF]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-[#010C2D]">{item.label}</span>
              {!compact && item.desc && (
                <span className="block truncate text-[13px] text-[#465058]">{item.desc}</span>
              )}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
          </button>
        ))}
      </div>
    </section>
  )
}
