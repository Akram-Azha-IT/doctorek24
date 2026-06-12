'use client'

import { useRouter } from 'next/navigation'
import { CalendarDays, ArrowRight } from 'lucide-react'
import type { RendezVous } from '@/lib/types'
import { patientName, patientInitials, avatarHue } from '../utils'

interface UpcomingAppointmentsProps {
  rdvs: RendezVous[]
  today: string
}

export function UpcomingAppointments({ rdvs, today }: UpcomingAppointmentsProps) {
  const router = useRouter()

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #EEF1F6', boxShadow: '0 1px 4px rgba(16,30,54,0.06)' }}
    >
      <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: '#F0F2F5' }}>
        <div>
          <p className="text-sm font-bold" style={{ color: '#010C2D' }}>Prochains rendez-vous</p>
          <p className="text-xs mt-0.5" style={{ color: '#A0AEC0' }}>À venir — non annulés</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
            style={{ background: '#EBF4FF', color: '#007DFF' }}
          >
            {rdvs.length}
          </span>
          <button
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: '#007DFF' }}
            onClick={() => router.push('/dashboard/medecin/agenda')}
          >
            Voir tout <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {rdvs.length === 0 ? (
        <div className="py-14 flex flex-col items-center gap-4">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center relative"
            style={{ background: 'linear-gradient(135deg, #EBF4FF, #DFEFFE)' }}
          >
            <CalendarDays className="h-7 w-7" style={{ color: '#007DFF' }} />
            <span
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: '#2EB67D', border: '2px solid white' }}
            >0</span>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: '#010C2D' }}>Agenda dégagé</p>
            <p className="text-xs mt-1 max-w-[220px]" style={{ color: '#A0AEC0' }}>
              Profitez de ce moment pour mettre à jour vos dossiers patients.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* Desktop: table header */}
          <div
            className="hidden md:grid px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: '#A0AEC0', background: '#FAFBFC', gridTemplateColumns: '1fr 150px 90px' }}
          >
            <span>Patient</span>
            <span>Motif</span>
            <span>Date / Heure</span>
          </div>

          {rdvs.map((rdv, idx) => {
            const name     = patientName(rdv)
            const initials = patientInitials(rdv)
            const hue      = avatarHue(rdv.patientId)
            const isToday  = rdv.dateRdv === today
            const dateStr  = isToday
              ? "Aujourd'hui"
              : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(
                  new Date(rdv.dateRdv + 'T00:00:00')
                )
            const motif = rdv.questionnaire?.motif ?? rdv.motif

            return (
              <div key={rdv.id} className="border-t" style={{ borderColor: '#F0F2F5' }}>
                {/* Desktop row */}
                <div
                  className="hidden md:grid items-center px-5 py-3.5 transition-colors"
                  style={{
                    gridTemplateColumns: '1fr 150px 90px',
                    background: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F9FF' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                      style={{ background: `hsl(${hue} 60% 55%)` }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#010C2D' }}>{name}</p>
                      <p className="text-xs truncate" style={{ color: '#A0AEC0' }}>{rdv.duree} min</p>
                    </div>
                  </div>
                  <p className="text-xs truncate" style={{ color: '#6B7A99' }}>{motif || 'Consultation'}</p>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#010C2D' }}>{rdv.heureRdv.slice(0, 5)}</p>
                    <p className="text-[11px]" style={{ color: '#A0AEC0' }}>{dateStr}</p>
                  </div>
                </div>

                {/* Mobile card */}
                <div
                  className="flex md:hidden items-center gap-3 px-4 py-3"
                  style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC' }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                    style={{ background: `hsl(${hue} 60% 55%)` }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#010C2D' }}>{name}</p>
                    <p className="text-xs truncate" style={{ color: '#A0AEC0' }}>
                      {dateStr} · {rdv.heureRdv.slice(0, 5)} · {motif || 'Consultation'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
