import Link from 'next/link'
import type { RendezVous } from '@/lib/types'
import { formatDateShort } from '../utils'

interface StatCardsProps {
  totalRdvs: number
  hasCarte: boolean
  prochainRdv: RendezVous | undefined
  derniersRdvs: RendezVous[]
}

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

export function StatCards({ totalRdvs, hasCarte, prochainRdv, derniersRdvs }: StatCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Consultations */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#007DFF]/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#333333]">Consultations</span>
          </div>
          <ChevronRight />
        </div>
        {derniersRdvs[0] && (
          <p className="text-xs text-[#465058] mb-1">Dernière le {formatDateShort(derniersRdvs[0].dateRdv)}</p>
        )}
        <p className="text-2xl font-bold text-[#333333]">{String(totalRdvs).padStart(2, '0')}</p>
        <p className="text-xs text-[#465058]">total rendez-vous</p>
      </div>

      {/* Carte médicale */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#007DFF]/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#333333]">Carte Médicale</span>
          </div>
          <ChevronRight />
        </div>
        <p className="text-xs text-[#465058] mb-1">{hasCarte ? 'Active' : 'Non configurée'}</p>
        {hasCarte ? (
          <p className="text-2xl font-bold text-emerald-600">✓</p>
        ) : (
          <Link href="/dashboard/patient/carte" className="mt-1 inline-block text-xs font-semibold text-[#007DFF] hover:underline">
            Créer ma carte →
          </Link>
        )}
        <p className="text-xs text-[#465058]">{hasCarte ? 'Données médicales sécurisées' : 'Accès rapide à vos données'}</p>
      </div>

      {/* Prochain RDV */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#007DFF]/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007DFF" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#333333]">Prochain RDV</span>
          </div>
          <ChevronRight />
        </div>
        {prochainRdv ? (
          <>
            <p className="text-xs text-[#465058] mb-1">{formatDateShort(prochainRdv.dateRdv)}</p>
            <p className="text-lg font-bold text-[#333333]">{prochainRdv.heureRdv}</p>
            <p className="text-xs text-[#465058]">{prochainRdv.motif ?? 'Consultation'}</p>
          </>
        ) : (
          <>
            <p className="text-xs text-[#465058] mb-1">Aucun à venir</p>
            <Link href="/recherche" className="text-xs font-semibold text-[#007DFF] hover:underline">
              Trouver un médecin →
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
