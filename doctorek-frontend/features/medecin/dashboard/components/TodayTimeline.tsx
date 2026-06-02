'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Clock4 } from 'lucide-react'
import type { RendezVous, StatutRdv } from '@/lib/types'
import { STATUT_BADGE, STATUT_DOT, STATUT_LABELS } from '../utils'

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
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #EEF1F6', boxShadow: '0 1px 4px rgba(16,30,54,0.06)' }}
    >
      <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b" style={{ borderColor: '#F0F2F5' }}>
        <div>
          <p className="text-sm font-bold" style={{ color: '#010C2D' }}>Programme du jour</p>
          <p className="text-xs mt-0.5" style={{ color: '#A0AEC0' }}>
            {active.length === 0 ? 'Journée libre' : `${active.length} rendez-vous`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{ background: '#EBF4FF' }}>
          <Clock4 className="h-3.5 w-3.5" style={{ color: '#007DFF' }} />
          <span className="text-xs font-bold" style={{ color: '#007DFF' }}>
            {String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:{String(nowMinutes % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="px-5 pb-5 pt-4">
          <div className="relative" style={{ height: 260 }}>
            {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => {
              const pct = ((h * 60 - 8 * 60) / (10 * 60)) * 100
              return (
                <div key={h} className="absolute left-0 right-0 flex items-center gap-2" style={{ top: `${pct}%` }}>
                  <span className="text-[10px] font-semibold w-7 shrink-0 text-right leading-none" style={{ color: '#E0E6EF' }}>
                    {h}h
                  </span>
                  <div className="flex-1 h-px" style={{ background: '#F0F2F5' }} />
                </div>
              )
            })}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: '#F5F7FA' }}>
                <CalendarDays className="h-6 w-6" style={{ color: '#C4CFDD' }} />
              </div>
              <p className="text-sm text-center" style={{ color: '#A0AEC0' }}>
                Aucun rendez-vous<br />aujourd&apos;hui
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 pb-5 pt-4">
          <div className="relative" style={{ height: 260 }}>
            {hourMarks.map((h) => {
              const pct = toPercent(h * 60)
              return (
                <div key={h} className="absolute left-0 right-0 flex items-center gap-2" style={{ top: `${pct}%` }}>
                  <span className="text-[10px] font-semibold w-7 shrink-0 text-right leading-none" style={{ color: '#C4CFDD' }}>
                    {h}h
                  </span>
                  <div className="flex-1 h-px" style={{ background: '#F0F2F5' }} />
                </div>
              )
            })}

            {nowVisible && (
              <div className="absolute left-0 right-0 z-20 flex items-center gap-2 pointer-events-none" style={{ top: `${nowPct}%` }}>
                <span className="w-7 shrink-0" />
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0 animate-pulse" style={{ background: '#E01E5A', boxShadow: '0 0 0 3px rgba(224,30,90,0.2)' }} />
                  <div className="flex-1 h-px" style={{ background: '#E01E5A', opacity: 0.4 }} />
                </div>
              </div>
            )}

            {active.map((rdv) => {
              const min = parseMin(rdv.heureRdv)
              const pct = toPercent(min)
              const past = min < nowMinutes
              const badge = STATUT_BADGE[rdv.statut]
              return (
                <div
                  key={rdv.id}
                  className="absolute left-0 right-0 z-10 flex items-center gap-2"
                  style={{ top: `${pct}%`, transform: 'translateY(-50%)' }}
                >
                  <span className="w-7 shrink-0" />
                  <div className="flex-1 flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0 ring-2 ring-white"
                      style={{ background: past ? '#C4CFDD' : STATUT_DOT[rdv.statut], opacity: past ? 0.5 : 1 }}
                    />
                    <span
                      className="rounded-lg px-2.5 py-1 text-xs font-bold"
                      style={past ? { background: '#F5F7FA', color: '#A0AEC0' } : { background: badge.bg, color: badge.color }}
                    >
                      {rdv.heureRdv.slice(0, 5)}
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: '#C4CFDD' }}>{rdv.duree}min</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-2 flex items-center gap-4 flex-wrap">
            {(['CONFIRME', 'EN_ATTENTE', 'ANNULE'] as StatutRdv[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUT_DOT[s] }} />
                <span className="text-[10px] font-semibold" style={{ color: '#A0AEC0' }}>{STATUT_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
