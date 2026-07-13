import type { RendezVous } from '@/lib/types'
import { localDateISO } from '../utils'

export function WeeklyChart({ rdvs }: { rdvs: RendezVous[] }) {
  const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const counts = [0, 0, 0, 0, 0, 0, 0]

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffISO = localDateISO(cutoff)

  rdvs.forEach((rdv) => {
    if (rdv.dateRdv >= cutoffISO && rdv.statut !== 'ANNULE') {
      const d = new Date(rdv.dateRdv + 'T00:00:00')
      const dow = (d.getDay() + 6) % 7
      counts[dow]++
    }
  })

  const max = Math.max(...counts, 1)
  const todayDow = (new Date().getDay() + 6) % 7
  const total = counts.reduce((a, b) => a + b, 0)

  return (
    <div className="rounded-2xl border border-[#EEF1F6] bg-white p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold text-[#010C2D]">Activité hebdomadaire</p>
        <span className="text-xs tabular-nums text-[#A0AEC0]">{total} RDV / 30 j</span>
      </div>

      <div className="mt-5 flex items-end gap-2" style={{ height: 110 }}>
        {DAYS.map((day, i) => {
          const pct = (counts[i] / max) * 100
          const isToday = i === todayDow
          return (
            <div key={day} className="flex flex-1 flex-col items-center justify-end gap-1.5">
              <span
                className={`text-[10px] tabular-nums leading-none ${
                  counts[i] > 0 ? 'font-semibold text-[#6B7A99]' : 'text-transparent'
                }`}
              >
                {counts[i]}
              </span>
              <div className="flex w-full items-end justify-center" style={{ height: 72 }}>
                <div
                  className="w-full rounded-t transition-all duration-500"
                  style={{
                    height: `${Math.max(pct, 3)}%`,
                    background: isToday ? '#007DFF' : '#C9E2FF',
                  }}
                />
              </div>
              <span className={`text-[10px] font-semibold ${isToday ? 'text-[#007DFF]' : 'text-[#A0AEC0]'}`}>
                {day}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
