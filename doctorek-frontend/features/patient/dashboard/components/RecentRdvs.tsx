'use client'

import Link from 'next/link'
import { useMedecin } from '@/features/annuaire/hooks'
import type { RendezVous } from '@/lib/types'
import { formatDateFR, STATUT_COLORS, STATUT_LABELS } from '../utils'

function RecentRdvRow({ rdv }: { rdv: RendezVous }) {
  const { data: medecin } = useMedecin(rdv.medecinId)
  const medecinNom = medecin ? `Dr. ${medecin.firstName} ${medecin.lastName}` : 'Médecin...'
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F0F2F5] last:border-0">
      <div>
        <p className="text-sm font-medium text-[#333333]">{medecinNom}</p>
        <p className="text-xs text-[#465058] mt-0.5">{formatDateFR(rdv.dateRdv)} · {rdv.heureRdv}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUT_COLORS[rdv.statut]}`}>
        {STATUT_LABELS[rdv.statut]}
      </span>
    </div>
  )
}

interface RecentRdvsProps {
  rdvs: RendezVous[]
}

export function RecentRdvs({ rdvs }: RecentRdvsProps) {
  if (rdvs.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#333333]">Historique des rendez-vous</h2>
        <Link href="/dashboard/patient/rdvs" className="text-xs font-semibold text-[#007DFF] hover:underline">
          Voir tout
        </Link>
      </div>
      <div>
        {rdvs.map((rdv) => (
          <RecentRdvRow key={rdv.id} rdv={rdv} />
        ))}
      </div>
    </div>
  )
}
