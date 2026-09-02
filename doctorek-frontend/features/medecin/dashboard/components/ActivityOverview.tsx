import type { Disponibilite, RendezVous } from '@/lib/types'
import { computeTotalWeekSlots, getWeekRange, localDateISO } from '../utils'

interface ActivityOverviewProps {
  rdvs: RendezVous[]
  disponibilites: Disponibilite[]
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function ActivityOverview({ rdvs, disponibilites }: ActivityOverviewProps) {
  const { monday, sunday } = getWeekRange()
  const totalSlots = computeTotalWeekSlots(disponibilites)
  const bookedCount = rdvs.filter(
    (rdv) => rdv.dateRdv >= monday && rdv.dateRdv <= sunday && rdv.statut !== 'ANNULE'
  ).length
  const occupation = totalSlots > 0
    ? Math.min(Math.round((bookedCount / totalSlots) * 100), 100)
    : 0
  const occupationColor = occupation >= 80 ? '#E01E5A' : occupation >= 50 ? '#ECB22E' : '#21B573'

  const counts = [0, 0, 0, 0, 0, 0, 0]
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffISO = localDateISO(cutoff)

  rdvs.forEach((rdv) => {
    if (rdv.dateRdv >= cutoffISO && rdv.statut !== 'ANNULE') {
      const date = new Date(`${rdv.dateRdv}T00:00:00`)
      counts[(date.getDay() + 6) % 7] += 1
    }
  })

  const max = Math.max(...counts, 1)
  const todayDow = (new Date().getDay() + 6) % 7
  const total = counts.reduce((sum, value) => sum + value, 0)

  return (
    <section
      aria-labelledby="weekly-activity-title"
      className="overflow-hidden rounded-2xl border border-[#E4EAF2] bg-white shadow-[0_10px_25px_rgba(26,58,100,0.035)]"
    >
      <div className="border-b border-[#EEF2F7] px-6 py-5">
        <h2 id="weekly-activity-title" className="text-[15px] font-bold text-[#071A47]">
          Activité hebdomadaire
        </h2>
      </div>

      <div className="grid min-h-[238px] md:grid-cols-2">
        <div className="flex flex-col justify-between px-6 py-6 md:border-r md:border-[#E7EDF5]">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#071A47]">Taux d&apos;occupation</p>
                <p className="mt-1 text-xs text-[#8090AA]">Semaine en cours</p>
              </div>
              <span className="text-[28px] font-extrabold tabular-nums" style={{ color: occupationColor }}>
                {occupation}%
              </span>
            </div>

            <div className="mt-8 h-2.5 w-full overflow-hidden rounded-full bg-[#EDF0F4]">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${occupation}%`, background: occupationColor }}
              />
            </div>
          </div>

          <dl className="mt-8 flex items-end justify-between">
            <div>
              <dt className="text-xs text-[#8090AA]">Réservés</dt>
              <dd className="mt-1 text-lg font-extrabold tabular-nums text-[#071A47]">{bookedCount}</dd>
            </div>
            <div className="text-right">
              <dt className="text-xs text-[#8090AA]">Disponibles</dt>
              <dd className="mt-1 text-lg font-extrabold tabular-nums text-[#071A47]">
                {Math.max(0, totalSlots - bookedCount)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex min-h-[230px] flex-col border-t border-[#E7EDF5] px-6 py-6 md:border-t-0">
          <p className="text-right text-xs tabular-nums text-[#8090AA]">{total} RDV / 30 j</p>
          <div className="mt-auto flex h-[120px] items-end gap-2" aria-label={`Activité des 30 derniers jours : ${total} rendez-vous`}>
            {DAYS.map((day, index) => {
              const isToday = index === todayDow
              const height = counts[index] === 0 ? 3 : Math.max(16, (counts[index] / max) * 100)
              return (
                <div key={day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className={`text-[10px] tabular-nums ${counts[index] ? 'text-[#6B7FA3]' : 'text-transparent'}`}>
                    {counts[index]}
                  </span>
                  <div className="flex h-[74px] w-full items-end">
                    <div
                      className="w-full rounded-t-sm transition-[height] duration-500"
                      style={{
                        height: `${height}%`,
                        background: isToday ? '#087CFA' : '#CFE3FA',
                      }}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold ${isToday ? 'text-[#087CFA]' : 'text-[#8090AA]'}`}>
                    {day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
