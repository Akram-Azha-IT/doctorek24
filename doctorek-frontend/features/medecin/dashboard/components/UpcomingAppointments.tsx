'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ArrowRight, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react'
import type { RendezVous } from '@/lib/types'
import { DocumentsRequisSection } from '@/features/agenda/components/DocumentsRequisSection'
import { patientName, patientInitials, avatarHue } from '../utils'

interface UpcomingAppointmentsProps {
  rdvs: RendezVous[]
  today: string
}

const STATUT_BADGE: Record<string, { label: string; className: string }> = {
  EN_ATTENTE: { label: 'En attente', className: 'bg-[#FFF8E6] text-[#B7791F]' },
  CONFIRME: { label: 'Confirmé', className: 'bg-[#E6F8F0] text-[#1B7A4E]' },
  TERMINE: { label: 'Terminé', className: 'bg-[#F0F2F5] text-[#6B7A99]' },
}

export function UpcomingAppointments({ rdvs, today }: UpcomingAppointmentsProps) {
  const router = useRouter()
  const [openPrepId, setOpenPrepId] = useState<string | null>(null)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#EEF1F6] bg-white">
      <div className="flex items-center justify-between border-b border-[#F0F2F5] px-5 py-4">
        <p className="text-sm font-bold text-[#010C2D]">
          Prochains rendez-vous
          <span className="ml-2 font-semibold text-[#A0AEC0]">{rdvs.length}</span>
        </p>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-semibold text-[#007DFF] hover:text-[#00263C] transition-colors"
          onClick={() => router.push('/dashboard/medecin/agenda')}
        >
          Voir tout <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {rdvs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F2F5]">
            <CalendarDays className="h-5 w-5 text-[#A0AEC0]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#010C2D]">Aucun rendez-vous à venir</p>
            <p className="mt-1 text-xs text-[#A0AEC0]">
              Les nouvelles réservations apparaîtront ici.
            </p>
          </div>
        </div>
      ) : (
        <ul>
          {rdvs.map((rdv) => {
            const name = patientName(rdv)
            const initials = patientInitials(rdv)
            const hue = avatarHue(rdv.patientId)
            const isToday = rdv.dateRdv === today
            const dateStr = isToday
              ? "Aujourd'hui"
              : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(
                  new Date(rdv.dateRdv + 'T00:00:00')
                )
            const motif = rdv.questionnaire?.message ?? rdv.motif
            const badge = STATUT_BADGE[rdv.statut]
            const isPrepOpen = openPrepId === rdv.id

            return (
              <li key={rdv.id} className="border-t border-[#F0F2F5]">
                <div className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#FAFBFC]">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: `hsl(${hue} 55% 45%)` }}
                  >
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#010C2D]">{name}</p>
                    <p className="truncate text-xs text-[#6B7A99]">
                      {motif || 'Consultation'} · {rdv.duree} min
                    </p>
                  </div>

                  {badge && (
                    <span className={`hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setOpenPrepId(isPrepOpen ? null : rdv.id)}
                    aria-expanded={isPrepOpen}
                    className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isPrepOpen
                        ? 'bg-[#007DFF] text-white'
                        : 'bg-[#EBF4FF] text-[#007DFF] hover:bg-[#DFEFFE]'
                    }`}
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Préparer
                    {isPrepOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <div className="w-[76px] shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-[#010C2D]">
                      {rdv.heureRdv.slice(0, 5)}
                    </p>
                    <p className={`text-[11px] ${isToday ? 'font-semibold text-[#007DFF]' : 'text-[#A0AEC0]'}`}>
                      {dateStr}
                    </p>
                  </div>
                </div>

                {/* Préparation du RDV : demander des documents au patient, sans quitter le dashboard */}
                {isPrepOpen && (
                  <div className="border-t border-[#F0F2F5] bg-[#FAFBFC] px-5 py-4">
                    <DocumentsRequisSection rdvId={rdv.id} mode="medecin" />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
