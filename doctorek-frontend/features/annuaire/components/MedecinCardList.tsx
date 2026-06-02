'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useQueries } from '@tanstack/react-query'
import { MedecinAvatar } from './MedecinAvatar'
import { getCreneaux } from '@/features/agenda/api'
import type { MedecinProfile, BookingSlot, Creneau } from '@/lib/types'
import { nextNDaysISO } from '@/lib/disponibilite'

function hasFutureSlots(date: string, todayISO: string, data: Creneau[] | undefined): boolean {
  if (!data) return false
  const available = data.filter(s => s.disponible)
  if (date !== todayISO) return available.length > 0
  const now = new Date()
  return available.some(s => {
    const [h, m] = s.debut.split(':').map(Number)
    const t = new Date(); t.setHours(h, m, 0, 0)
    return t > now
  })
}

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function formatDayLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return {
    day: DAYS_FR[d.getDay()].toUpperCase(),
    date: d.getDate(),
    month: MONTHS_FR[d.getMonth()],
  }
}

function formatNextAvailable(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`
}

function PinIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.686-7-11a7 7 0 1114 0c0 4.314-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function VideoIcon() {
  return (
    <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l-6-6-6 6" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  )
}

function CalendarOffIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18M9 14l6 6M15 14l-6 6" />
    </svg>
  )
}

function CalendarNextIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 16l3 3 3-3M12 12v7" />
    </svg>
  )
}

interface MedecinCardListProps {
  medecin: MedecinProfile
  availableToday: boolean
  distanceKm?: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onBookSlot?: (slot: BookingSlot) => void
}

export function MedecinCardList({ medecin, availableToday, distanceKm, onMouseEnter, onMouseLeave, onBookSlot }: MedecinCardListProps) {
  const allFutureDates = useMemo(() => nextNDaysISO(365), [])
  const [windowStart, setWindowStart] = useState(0)
  const visibleDates = useMemo(
    () => allFutureDates.slice(windowStart, windowStart + 5),
    [allFutureDates, windowStart]
  )
  const extendedDates = useMemo(
    () => allFutureDates.slice(windowStart + 5, windowStart + 30),
    [allFutureDates, windowStart]
  )

  const [selectedDate, setSelectedDate] = useState(allFutureDates[0])
  const [slotIdx, setSlotIdx] = useState(0)
  const accepte = medecin.acceptNouveauxPatients !== false

  // Keep selectedDate inside visible window when window shifts
  useEffect(() => {
    if (!visibleDates.includes(selectedDate)) {
      setSelectedDate(visibleDates[0])
    }
  }, [windowStart]) // eslint-disable-line react-hooks/exhaustive-deps

  const allDaysResults = useQueries({
    queries: visibleDates.map(date => ({
      queryKey: ['creneaux', medecin.id, date],
      queryFn: () => getCreneaux(medecin.id, date),
      staleTime: 30_000,
    })),
  })

  const selectedDateIdx = visibleDates.indexOf(selectedDate)
  const selectedResult = allDaysResults[selectedDateIdx]
  const slots = selectedResult?.data ?? []
  const isLoading = selectedResult?.isLoading ?? true

  const todayISO = allFutureDates[0]
  const allLoaded = allDaysResults.every(r => !r.isLoading)
  const allUnavailable = allLoaded && allDaysResults.every((r, i) =>
    !hasFutureSlots(visibleDates[i], todayISO, r.data)
  )

  // Search next 25 days beyond visible window only when all 5 visible are unavailable
  const extendedResults = useQueries({
    queries: extendedDates.map(date => ({
      queryKey: ['creneaux', medecin.id, date],
      queryFn: () => getCreneaux(medecin.id, date),
      staleTime: 30_000,
      enabled: allUnavailable,
    })),
  })

  const nextAvailableInfo = useMemo(() => {
    if (!allUnavailable) return null
    for (let i = 0; i < extendedDates.length; i++) {
      const slot = extendedResults[i]?.data?.find(s => s.disponible)
      if (slot) return { date: extendedDates[i], heure: slot.debut }
    }
    return null
  }, [allUnavailable, extendedDates, extendedResults])

  const extendedLoading = allUnavailable && extendedResults.some(r => r.isLoading)

  const availableSlots = useMemo(() => {
    const isToday = selectedDate === allFutureDates[0]
    const now = new Date()
    return slots.filter(s => {
      if (!s.disponible) return false
      if (!isToday) return true
      const [h, m] = s.debut.split(':').map(Number)
      const slotTime = new Date()
      slotTime.setHours(h, m, 0, 0)
      return slotTime > now
    })
  }, [slots, selectedDate, allFutureDates])

  const isUnavailable = !isLoading && availableSlots.length === 0

  // Reset slot index when date changes
  useEffect(() => { setSlotIdx(0) }, [selectedDate])

  const currentSlot = availableSlots[slotIdx] ?? null
  const canGoUp = slotIdx > 0
  const canGoDown = slotIdx < availableSlots.length - 1
  const slotRef = useRef<HTMLDivElement>(null)

  // Non-passive wheel listener so preventDefault actually works
  useEffect(() => {
    const el = slotRef.current
    if (!el || availableSlots.length <= 1) return
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0 && slotRef.current && parseInt(slotRef.current.dataset.canDown ?? '0')) {
        e.preventDefault()
        setSlotIdx(i => i + 1)
      } else if (e.deltaY < 0 && slotRef.current && parseInt(slotRef.current.dataset.canUp ?? '0')) {
        e.preventDefault()
        setSlotIdx(i => i - 1)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [availableSlots.length])

  const handleSlotKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && canGoDown) { e.preventDefault(); setSlotIdx(i => i + 1) }
    else if (e.key === 'ArrowUp' && canGoUp) { e.preventDefault(); setSlotIdx(i => i - 1) }
  }, [canGoUp, canGoDown])

  return (
    <div
      className="group mb-3 rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.07)] transition-all duration-200 hover:shadow-[0_6px_28px_rgba(0,125,255,0.11)]"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex flex-col sm:flex-row sm:items-stretch">

        {/* ── Doctor info ─────────────────────────────── */}
        <Link href={`/medecins/${medecin.id}`} className="flex min-w-0 flex-1 gap-4 px-5 py-5">

          {/* Avatar */}
          <div className="relative shrink-0 self-start mt-0.5">
            <div className={`rounded-full ring-2 ring-offset-2 transition-colors duration-200 ${availableToday ? 'ring-emerald-300' : 'ring-[#B6DAF7]'}`}>
              <MedecinAvatar
                firstName={medecin.firstName}
                lastName={medecin.lastName}
                photoUrl={medecin.photoUrl ?? null}
                size="lg"
              />
            </div>
            {availableToday && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">

            <div className="flex flex-col gap-1.5">
              {/* Name + sector */}
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-[#010C2D] transition-colors group-hover:text-[#007DFF]">
                  Dr. {medecin.firstName} {medecin.lastName}
                </h3>
                {medecin.secteurTarifaire && (
                  <span className="rounded-full bg-[#EBF4FF] px-2 py-0.5 text-[10px] font-bold text-[#1863A9]">
                    Secteur {medecin.secteurTarifaire}
                  </span>
                )}
              </div>

              {/* Specialty */}
              <p className="text-[13px] font-semibold text-[#007DFF]">{medecin.specialite}</p>

              {/* Address */}
              <p className="flex items-center gap-1 truncate text-xs text-zinc-400">
                <PinIcon />
                {medecin.adresse}, {medecin.ville}
                {distanceKm !== undefined && (
                  <span className="ml-1 font-medium text-zinc-500">
                    · {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
                  </span>
                )}
              </p>
            </div>

            {/* Tags — anchored to bottom */}
            <div className="flex flex-wrap items-center gap-1.5">
              {availableToday && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Disponible aujourd&apos;hui
                </span>
              )}
              {accepte ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF4FF] px-2 py-0.5 text-[11px] font-semibold text-[#1863A9]">
                  <CheckIcon />
                  Nouveaux patients
                </span>
              ) : (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                  Complet
                </span>
              )}
              {medecin.consultationVideo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-600 ring-1 ring-inset ring-violet-200">
                  <VideoIcon />
                  Consultation vidéo
                </span>
              )}
              {medecin.langues && medecin.langues.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                  <GlobeIcon />
                  {medecin.langues.slice(0, 2).join(', ')}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* ── Slot section ─────────────────────────────── */}
        <div className="flex w-full shrink-0 flex-col border-t border-zinc-100 px-4 py-4 sm:w-[290px] sm:border-t-0 sm:border-l">

          {allUnavailable ? (
            /* Fully booked — show next available date or "no availability" */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl bg-zinc-50 px-4 py-5 ring-1 ring-inset ring-zinc-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                <CalendarOffIcon />
              </div>
              <div className="text-center">
                <p className="text-[12px] font-semibold text-zinc-500">Aucune dispo cette semaine</p>
              </div>

              {extendedLoading ? (
                <div className="h-8 w-40 animate-pulse rounded-full bg-zinc-200" />
              ) : nextAvailableInfo ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const idx = allFutureDates.indexOf(nextAvailableInfo.date)
                    if (idx !== -1) {
                      setWindowStart(idx)
                      setSelectedDate(nextAvailableInfo.date)
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#007DFF] px-4 py-2 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#00263C] hover:scale-[1.02] active:scale-95"
                >
                  <CalendarNextIcon />
                  Prochaine dispo : {formatNextAvailable(nextAvailableInfo.date)}
                </button>
              ) : (
                <Link
                  href={`/medecins/${medecin.id}`}
                  className="inline-flex items-center gap-1 rounded-full bg-[#EBF4FF] px-3 py-1.5 text-[11px] font-semibold text-[#1863A9] transition-colors hover:bg-[#D6EAFF]"
                  onClick={e => e.stopPropagation()}
                >
                  Voir le profil →
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Day tabs + prev/next arrows */}
              <div className="mb-3 flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setWindowStart(w => Math.max(0, w - 1)) }}
                  disabled={windowStart === 0}
                  className="flex shrink-0 h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-all hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon />
                </button>

                <div className="flex flex-1 gap-1">
                  {visibleDates.map((date, i) => {
                    const { day, date: d, month } = formatDayLabel(date)
                    const isSelected = date === selectedDate
                    const isToday = windowStart === 0 && i === 0
                    const dayResult = allDaysResults[i]
                    const dayHasSlots = !dayResult?.isLoading && hasFutureSlots(date, todayISO, dayResult?.data)
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={(e) => { e.preventDefault(); setSelectedDate(date) }}
                        className={`relative flex flex-1 flex-col items-center rounded-xl px-1 py-2 text-center transition-all duration-150 ${
                          isSelected
                            ? 'bg-[#007DFF] text-white shadow-sm'
                            : isToday
                              ? 'bg-[#EBF4FF] text-[#1863A9] hover:bg-[#D6EAFF]'
                              : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">{day}</span>
                        <span className="text-[15px] font-bold leading-snug">{d}</span>
                        <span className={`text-[10px] leading-tight ${isSelected ? 'opacity-75' : 'text-zinc-400'}`}>{month}</span>
                        {dayHasSlots && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setWindowStart(w => Math.min(360, w + 1)) }}
                  disabled={windowStart >= 360}
                  className="flex shrink-0 h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-all hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon />
                </button>
              </div>

              {/* Slot area */}
              <div className="flex flex-1 flex-col justify-center">
                {isLoading ? (
                  <div className="h-12 animate-pulse rounded-xl bg-zinc-100" />
                ) : isUnavailable ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-zinc-50 px-3 py-3 ring-1 ring-inset ring-zinc-100">
                    <span className="text-[11px] font-medium text-zinc-400">Aucune dispo ce jour</span>
                  </div>
                ) : (
                  <div
                    ref={slotRef}
                    className="flex flex-col items-center gap-1.5 rounded-xl outline-none"
                    onKeyDown={handleSlotKeyDown}
                    tabIndex={availableSlots.length > 1 ? 0 : -1}
                    role="spinbutton"
                    aria-valuenow={slotIdx + 1}
                    aria-valuemin={1}
                    aria-valuemax={availableSlots.length}
                    data-can-up={canGoUp ? '1' : '0'}
                    data-can-down={canGoDown ? '1' : '0'}
                  >
                    {/* Up arrow */}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setSlotIdx(i => i - 1) }}
                      className={`flex h-7 w-7 items-center justify-center rounded-full bg-[#EBF4FF] text-[#1863A9] transition-all hover:bg-[#007DFF] hover:text-white ${!canGoUp ? 'invisible' : ''}`}
                    >
                      <ChevronUpIcon />
                    </button>

                    {/* Single slot button */}
                    {currentSlot && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onBookSlot?.({ medecin, date: selectedDate, debut: currentSlot.debut, fin: currentSlot.fin })
                        }}
                        className="flex w-full items-center justify-center rounded-xl bg-emerald-500 py-2.5 text-[15px] font-bold text-white shadow-sm transition-all duration-150 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95"
                      >
                        {currentSlot.debut}
                      </button>
                    )}

                    {/* Slot counter */}
                    {availableSlots.length > 1 && (
                      <span className="text-[10px] font-medium text-zinc-400">
                        {slotIdx + 1} / {availableSlots.length}
                      </span>
                    )}

                    {/* Down arrow */}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setSlotIdx(i => i + 1) }}
                      className={`flex h-7 w-7 items-center justify-center rounded-full bg-[#EBF4FF] text-[#1863A9] transition-all hover:bg-[#007DFF] hover:text-white ${!canGoDown ? 'invisible' : ''}`}
                    >
                      <ChevronDownIcon />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
