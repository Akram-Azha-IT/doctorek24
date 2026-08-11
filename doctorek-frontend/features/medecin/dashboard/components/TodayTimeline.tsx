'use client'

import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import type { RendezVous } from '@/lib/types'

export function TodayTimeline({ rdvs }: { rdvs: RendezVous[] }) {
  const [nowMinutes, setNowMinutes] = useState(() => {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  })

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date()
      setNowMinutes(n.getHours() * 60 + n.getMinutes())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  const active = rdvs.filter((r) => r.statut !== 'ANNULE').sort((a, b) => a.heureRdv.localeCompare(b.heureRdv))
  const parseMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const allMins = active.map((r) => parseMin(r.heureRdv))
  const START = allMins.length ? Math.max(0, Math.min(...allMins) - 60) : 8 * 60
  const END = allMins.length ? Math.min(24 * 60, Math.max(...allMins) + 90) : 19 * 60
  const SPAN = END - START
  const toPercent = (min: number) => Math.max(0, Math.min(100, ((min - START) / SPAN) * 100))
  const nowPct = toPercent(nowMinutes)
  const nowVisible = nowMinutes >= START && nowMinutes <= END
  const hourMarks: number[] = []
  const startHour = Math.ceil(START / 60)
  const endHour = Math.floor(END / 60)
  for (let h = startHour; h <= endHour; h++) hourMarks.push(h)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#EEF1F6] bg-white">
      <div className="flex items-center justify-between border-b border-[#F0F2F5] px-5 py-4">
        <p className="text-sm font-bold text-[#010C2D]">
          Programme du jour
          <span className="ml-2 font-semibold text-[#A0AEC0]">
            {active.length}
          </span>
        </p>
        <span className="text-xs font-semibold tabular-nums text-[#6B7A99]">
          {String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:{String(nowMinutes % 60).padStart(2, '0')}
        </span>
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F2F5]">
            <CalendarDays className="h-5 w-5 text-[#A0AEC0]" />
          </div>
          <p className="text-center text-sm text-[#A0AEC0]">
            Aucun rendez-vous aujourd&apos;hui
          </p>
        </div>
      ) : (
        <div className="px-5 pb-5 pt-4">
          <div className="relative" style={{ height: 260 }}>
            {hourMarks.map((h) => {
              const pct = toPercent(h * 60)
              return (
                <div key={h} className="absolute left-0 right-0 flex items-center gap-2" style={{ top: `${pct}%` }}>
                  <span className="w-7 shrink-0 text-right text-[10px] leading-none tabular-nums text-[#C4CFDD]">
                    {h}h
                  </span>
                  <div className="h-px flex-1 bg-[#F0F2F5]" />
                </div>
              )
            })}

            {nowVisible && (
              <div
                className="pointer-events-none absolute left-0 right-0 z-20 flex items-center gap-2"
                style={{ top: `${nowPct}%` }}
              >
                <span className="w-7 shrink-0" />
                <div className="flex flex-1 items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E01E5A]" />
                  <div className="h-px flex-1 bg-[#E01E5A]/40" />
                </div>
              </div>
            )}

            {active.map((rdv) => {
              const min = parseMin(rdv.heureRdv)
              const pct = toPercent(min)
              const past = min < nowMinutes
              return (
                <div
                  key={rdv.id}
                  className="absolute left-0 right-0 z-10 flex items-center gap-2"
                  style={{ top: `${pct}%`, transform: 'translateY(-50%)' }}
                >
                  <span className="w-7 shrink-0" />
                  <div className="flex flex-1 items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white ${
                        past ? 'bg-[#C4CFDD]' : 'bg-[#007DFF]'
                      }`}
                    />
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${
                        past ? 'bg-[#F0F2F5] text-[#A0AEC0]' : 'bg-[#EBF4FF] text-[#007DFF]'
                      }`}
                    >
                      {rdv.heureRdv.slice(0, 5)}
                    </span>
                    <span className="text-[10px] text-[#A0AEC0]">{rdv.duree} min</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex items-center gap-4 border-t border-[#F0F2F5] pt-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#007DFF]" />
              <span className="text-[10px] font-medium text-[#A0AEC0]">À venir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#C4CFDD]" />
              <span className="text-[10px] font-medium text-[#A0AEC0]">Passé</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
