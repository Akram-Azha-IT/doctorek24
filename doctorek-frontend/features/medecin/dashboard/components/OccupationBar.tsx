import { TrendingUp } from 'lucide-react'
import type { Disponibilite, RendezVous } from '@/lib/types'
import { getWeekRange, computeTotalWeekSlots } from '../utils'

interface OccupationBarProps {
  rdvs: RendezVous[]
  disponibilites: Disponibilite[]
}

export function OccupationBar({ rdvs, disponibilites }: OccupationBarProps) {
  const { monday, sunday } = getWeekRange()
  const totalSlots = computeTotalWeekSlots(disponibilites)
  const bookedCount = rdvs.filter(
    (r) => r.dateRdv >= monday && r.dateRdv <= sunday && r.statut !== 'ANNULE'
  ).length
  const taux = totalSlots > 0 ? Math.min(Math.round((bookedCount / totalSlots) * 100), 100) : 0
  const barColor = taux >= 80 ? '#E01E5A' : taux >= 50 ? '#ECB22E' : '#2EB67D'
  const barBg = taux >= 80 ? '#FFEBEB' : taux >= 50 ? '#FFF8E6' : '#E6F8F0'

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#FFFFFF', border: '1px solid #EEF1F6', boxShadow: '0 1px 4px rgba(16,30,54,0.06)' }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#EBF4FF' }}>
          <TrendingUp className="h-5 w-5" style={{ color: '#007DFF' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: '#010C2D' }}>Taux d&apos;occupation</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#A0AEC0' }}>
            {bookedCount} / {totalSlots || '—'} créneaux — semaine en cours
          </p>
        </div>
        <span className="text-lg font-extrabold px-3 py-1 rounded-xl" style={{ color: barColor, background: barBg }}>
          {taux}%
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: '#F0F2F5' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${taux}%`,
            background: taux >= 80
              ? 'linear-gradient(to right, #C0063E, #E01E5A)'
              : taux >= 50
              ? 'linear-gradient(to right, #C8860A, #ECB22E)'
              : 'linear-gradient(to right, #1A9055, #2EB67D)',
            boxShadow: `0 0 8px ${barColor}55`,
          }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[10px]" style={{ color: '#C4CFDD' }}>0%</span>
        <span className="text-[10px]" style={{ color: '#C4CFDD' }}>100%</span>
      </div>
      <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: '1px solid #F0F2F5' }}>
        <div>
          <p className="text-[11px]" style={{ color: '#A0AEC0' }}>Créneaux utilisés</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: barColor }}>{bookedCount}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px]" style={{ color: '#A0AEC0' }}>Créneaux disponibles</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: '#2EB67D' }}>{Math.max(0, totalSlots - bookedCount)}</p>
        </div>
      </div>
    </div>
  )
}
