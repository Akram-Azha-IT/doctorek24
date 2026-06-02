'use client'

import { useRouter } from 'next/navigation'
import { CalendarDays, Clock4, CheckCircle2, ArrowRight } from 'lucide-react'

const ACTIONS = [
  { label: 'Agenda', sub: 'Gérer mes RDV', href: '/dashboard/medecin/agenda', bg: '#EBF4FF', color: '#007DFF', icon: <CalendarDays className="h-5 w-5" /> },
  { label: 'Disponibilités', sub: 'Mes créneaux', href: '/dashboard/medecin/disponibilites', bg: '#E6F8F0', color: '#2EB67D', icon: <Clock4 className="h-5 w-5" /> },
  { label: 'Profil', sub: 'Mes informations', href: '/dashboard/medecin/profil', bg: '#FFF8E6', color: '#ECB22E', icon: <CheckCircle2 className="h-5 w-5" /> },
]

export function QuickActions() {
  const router = useRouter()

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#FFFFFF', border: '1px solid #EEF1F6', boxShadow: '0 1px 4px rgba(16,30,54,0.06)' }}
    >
      <p className="text-sm font-bold mb-4" style={{ color: '#010C2D' }}>Accès rapide</p>
      <div className="flex flex-col gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.href}
            type="button"
            onClick={() => router.push(a.href)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-left w-full"
            style={{ border: '1px solid #EEF1F6' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F9FF' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: a.bg }}>
              <span style={{ color: a.color }}>{a.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: '#010C2D' }}>{a.label}</p>
              <p className="text-[11px]" style={{ color: '#A0AEC0' }}>{a.sub}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0" style={{ color: '#C4CFDD' }} />
          </button>
        ))}
      </div>
    </div>
  )
}
