'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQueries } from '@tanstack/react-query'
import { getCreneaux } from '@/features/agenda/api'
import { BookingDrawer } from '@/features/agenda/components/BookingDrawer'
import { nextNDaysISO } from '@/lib/disponibilite'
import type { BookingSlot, MedecinProfile } from '@/lib/types'

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function formatSlotLabel(iso: string, heure: string): string {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const isToday = d.getTime() === today.getTime()
  const isTomorrow = d.getTime() === tomorrow.getTime()
  if (isToday) return `Aujourd'hui à ${heure}`
  if (isTomorrow) return `Demain à ${heure}`
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} à ${heure}`
}

interface Props {
  medecin: MedecinProfile
}

export function MobileStickyBooking({ medecin }: Props) {
  const [bookingSlot, setBookingSlot] = useState<BookingSlot | null>(null)
  const dates = useMemo(() => nextNDaysISO(5), [])

  const results = useQueries({
    queries: dates.map(date => ({
      queryKey: ['creneaux', medecin.id, date],
      queryFn: () => getCreneaux(medecin.id, date),
      staleTime: 60_000,
    })),
  })

  const nextSlot = useMemo(() => {
    const now = new Date()
    for (let i = 0; i < dates.length; i++) {
      const creneaux = results[i]?.data ?? []
      const available = creneaux.filter(c => {
        if (!c.disponible) return false
        // filter past times on today
        if (i === 0) {
          const [h, m] = c.debut.split(':').map(Number)
          const t = new Date(); t.setHours(h, m, 0, 0)
          return t > now
        }
        return true
      })
      if (available.length > 0) return { date: dates[i], creneau: available[0] }
    }
    return null
  }, [dates, results])

  const loading = results.some(r => r.isLoading)
  const accepte = medecin.acceptNouveauxPatients !== false

  function handleSlotTap() {
    if (!nextSlot) return
    setBookingSlot({
      medecin,
      date: nextSlot.date,
      debut: nextSlot.creneau.debut,
      fin: nextSlot.creneau.fin,
    })
  }

  return (
    <>
      {/* Sticky bottom bar — mobile only */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E5E9F0] safe-area-pb">
        <div className="px-4 py-3 flex items-center gap-3">

          {/* Quick slot pill */}
          {nextSlot && accepte && !loading && (
            <button
              type="button"
              onClick={handleSlotTap}
              aria-label={`Prendre rendez-vous le ${formatSlotLabel(nextSlot.date, nextSlot.creneau.debut)}`}
              className="cursor-pointer flex-1 flex flex-col items-start rounded-xl bg-[#EBF4FF] border border-[#B6DAF7] px-3.5 py-2.5 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1863A9] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2EB67D]" aria-hidden="true" />
                Disponible
              </span>
              <span className="text-sm font-bold text-[#007DFF] mt-0.5 leading-tight">
                {formatSlotLabel(nextSlot.date, nextSlot.creneau.debut)}
              </span>
            </button>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="flex-1 rounded-xl bg-zinc-100 animate-pulse h-14" aria-hidden="true" />
          )}

          {/* No slots / not accepting */}
          {!loading && (!nextSlot || !accepte) && (
            <div className="flex-1 rounded-xl bg-zinc-50 border border-zinc-200 px-3.5 py-2.5">
              <span className="text-xs text-zinc-500">
                {!accepte ? 'N\'accepte plus de nouveaux patients' : 'Aucune disponibilité prochaine'}
              </span>
            </div>
          )}

          {/* Main CTA */}
          <Link
            href={`/medecins/${medecin.id}/rdv`}
            className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-[#007DFF] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2"
            aria-label="Voir toutes les disponibilités"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="hidden sm:inline">Voir disponibilités</span>
            <span className="sm:hidden">RDV</span>
          </Link>
        </div>
      </div>

      {/* Spacer so content isn't hidden behind sticky bar */}
      <div className="lg:hidden h-20" aria-hidden="true" />

      <BookingDrawer slot={bookingSlot} onClose={() => setBookingSlot(null)} />
    </>
  )
}
