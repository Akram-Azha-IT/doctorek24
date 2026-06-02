import { BarChart2 } from 'lucide-react'
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
    <div
      className="rounded-2xl p-5"
      style={{ background: '#FFFFFF', border: '1px solid #EEF1F6', boxShadow: '0 1px 4px rgba(16,30,54,0.06)' }}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-bold" style={{ color: '#010C2D' }}>Activité hebdomadaire</p>
          <p className="text-xs mt-0.5" style={{ color: '#A0AEC0' }}>30 derniers jours — {total} RDV</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: '#EBF4FF' }}>
          <BarChart2 className="h-4 w-4" style={{ color: '#007DFF' }} />
        </div>
      </div>

      <div className="flex items-end gap-2" style={{ height: 110 }}>
        {DAYS.map((day, i) => {
          const pct = (counts[i] / max) * 100
          const isToday = i === todayDow
          return (
            <div key={day} className="flex-1 flex flex-col items-center justify-end gap-1.5">
              <div className="w-full flex justify-center items-end" style={{ height: 96 }}>
                <div
                  className="w-full rounded-t-md transition-all duration-700"
                  style={{
                    height: `${Math.max(pct, 4)}%`,
                    background: isToday
                      ? 'linear-gradient(to top, #0055CC, #3DA8FF)'
                      : 'linear-gradient(to top, #C8DDFF, #D6EAFF)',
                    borderRadius: '4px 4px 0 0',
                    boxShadow: isToday ? '0 -2px 8px rgba(0,125,255,0.30)' : 'none',
                  }}
                />
              </div>
              <span className="text-[10px] font-bold" style={{ color: isToday ? '#007DFF' : '#C4CFDD' }}>
                {day}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
