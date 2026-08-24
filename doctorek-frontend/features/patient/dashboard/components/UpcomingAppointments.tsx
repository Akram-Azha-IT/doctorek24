'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMedecin } from '@/features/annuaire/hooks'
import { useStartConversation } from '@/features/messaging/hooks'
import type { RendezVous } from '@/lib/types'
import { formatDateShort } from '../utils'
import LogoLoader from '@/components/LogoLoader'

function UpcomingRdvRow({ rdv }: { rdv: RendezVous }) {
  const { data: medecin } = useMedecin(rdv.medecinId)
  const medecinNom = medecin ? `Dr. ${medecin.firstName} ${medecin.lastName}` : 'Médecin...'
  const isNext = rdv.statut === 'CONFIRME'
  const router = useRouter()
  const startConv = useStartConversation()
  const [messaging, setMessaging] = useState(false)

  async function handleMessage() {
    if (messaging) return
    setMessaging(true)
    try {
      const conv = await startConv.mutateAsync(rdv.medecinId)
      router.push(`/dashboard/patient/messages?conv=${conv.id}`)
    } catch {
      setMessaging(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-4 border-b border-[#F0F2F5] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#007DFF]/10 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#333333]">{rdv.motif ?? 'Consultation'}</p>
          <p className="text-xs text-[#465058] mt-0.5">
            {medecinNom} · {formatDateShort(rdv.dateRdv)} · {rdv.heureRdv}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleMessage}
          disabled={messaging}
          title={`Envoyer un message à ${medecinNom}`}
          className="w-8 h-8 rounded-full border border-[#007DFF]/30 bg-[#EBF4FF] flex items-center justify-center text-[#007DFF] hover:bg-[#007DFF] hover:text-white transition-colors disabled:opacity-50"
        >
          {messaging ? (
            <LogoLoader variant="mark" size={14} decorative />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          )}
        </button>
        {isNext ? (
          <Link
            href="/dashboard/patient/rdvs"
            className="flex items-center gap-1.5 rounded-full bg-[#007DFF] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#00263C] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            Rejoindre
          </Link>
        ) : (
          <Link
            href="/dashboard/patient/rdvs"
            className="rounded-full border border-[#007DFF] px-4 py-1.5 text-xs font-semibold text-[#007DFF] hover:bg-[#007DFF]/5 transition-colors"
          >
            Détails
          </Link>
        )}
      </div>
    </div>
  )
}

interface UpcomingAppointmentsProps {
  rdvs: RendezVous[]
}

export function UpcomingAppointments({ rdvs }: UpcomingAppointmentsProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#333333]">Rendez-vous à venir</h2>
        <Link href="/dashboard/patient/rdvs" className="text-xs font-semibold text-[#007DFF] hover:underline">
          Voir tout
        </Link>
      </div>
      {rdvs.length > 0 ? (
        <div>
          {rdvs.map((rdv) => (
            <UpcomingRdvRow key={rdv.id} rdv={rdv} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F0F2F5] flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p className="text-sm text-[#465058]">Aucun rendez-vous à venir</p>
          <Link href="/recherche" className="mt-2 text-sm font-semibold text-[#007DFF] hover:underline">
            Prendre un rendez-vous →
          </Link>
        </div>
      )}
    </div>
  )
}
