import Link from 'next/link'
import type { RendezVous } from '@/lib/types'
import { formatDateShort } from '../utils'

interface StatCardsProps {
  totalRdvs: number
  prochainRdv: RendezVous | undefined
  derniersRdvs: RendezVous[]
}

export function StatCards({ totalRdvs, prochainRdv, derniersRdvs }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">

      {/* Consultations */}
      <Link href="/dashboard/patient/rdvs" className="group bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow min-w-0">
        <div className="flex items-center gap-2 mb-4 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#007DFF]/10 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2" aria-hidden="true">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span className="text-[13px] sm:text-sm font-semibold text-[#333333] truncate">Consultations</span>
        </div>
        {derniersRdvs[0] && (
          <p className="text-xs text-[#465058] mb-1">Dernière le {formatDateShort(derniersRdvs[0].dateRdv)}</p>
        )}
        <p className="text-2xl font-bold text-[#333333] tabular-nums">{String(totalRdvs).padStart(2, '0')}</p>
        <p className="text-xs text-[#465058]">rendez-vous</p>
      </Link>

      {/* Prochain RDV */}
      <Link href="/dashboard/patient/rdvs" className="group bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow min-w-0">
        <div className="flex items-center gap-2 mb-4 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#007DFF]/10 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span className="text-[13px] sm:text-sm font-semibold text-[#333333] truncate whitespace-nowrap">Prochain RDV</span>
        </div>
        {prochainRdv ? (
          <>
            <p className="text-xs text-[#465058] mb-1">{formatDateShort(prochainRdv.dateRdv)}</p>
            <p className="text-lg font-bold text-[#333333] tabular-nums">{prochainRdv.heureRdv}</p>
            <p className="text-xs text-[#465058]">{prochainRdv.motif ?? 'Consultation'}</p>
          </>
        ) : (
          <>
            <p className="text-xs text-[#465058] mb-1">Aucun à venir</p>
            <p className="text-sm font-semibold text-[#007DFF] leading-snug">Trouver<br className="sm:hidden"/> un médecin →</p>
          </>
        )}
      </Link>

    </div>
  )
}
