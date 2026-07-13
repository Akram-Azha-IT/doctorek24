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
  // Semantic thresholds: green = capacity available, amber = filling up, red = saturated
  const barColor = taux >= 80 ? '#E01E5A' : taux >= 50 ? '#ECB22E' : '#2EB67D'

  return (
    <div className="rounded-2xl border border-[#EEF1F6] bg-white p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold text-[#010C2D]">Taux d&apos;occupation</p>
        <span className="text-lg font-extrabold tabular-nums" style={{ color: barColor }}>
          {taux}%
        </span>
      </div>
      <p className="mt-0.5 text-xs text-[#A0AEC0]">Semaine en cours</p>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#F0F2F5]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${taux}%`, background: barColor }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#F0F2F5] pt-3">
        <div>
          <p className="text-[11px] text-[#A0AEC0]">Réservés</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-[#010C2D]">{bookedCount}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#A0AEC0]">Disponibles</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-[#010C2D]">
            {Math.max(0, totalSlots - bookedCount)}
          </p>
        </div>
      </div>
    </div>
  )
}
