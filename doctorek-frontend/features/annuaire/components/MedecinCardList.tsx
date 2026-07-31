'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MedecinAvatar } from './MedecinAvatar'
import { ListeAttenteDialog } from '@/features/agenda/components/ListeAttenteDialog'
import { useSession } from '@/lib/useSession'
import type { MedecinProfile, BookingSlot } from '@/lib/types'
import { useCreneauxNavigation } from '../useCreneauxNavigation'

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

interface SlotPanelProps {
  readonly medecin: MedecinProfile
  readonly onBookSlot?: (slot: BookingSlot) => void
  readonly nav: ReturnType<typeof useCreneauxNavigation>
}

/** Habillage d'une pastille de jour, sorti du JSX pour éviter un ternaire imbriqué. */
function dayChipClass(isSelected: boolean, isToday: boolean): string {
  if (isSelected) return 'bg-[#007DFF] text-white shadow-sm'
  if (isToday) return 'bg-[#EBF4FF] text-[#1863A9] hover:bg-[#D6EAFF]'
  return 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
}

/** Agenda saturé sur la fenêtre visible : on oriente vers la prochaine ouverture. */
function NoAvailability({ medecin, nav, onAlerter }: Readonly<{ medecin: MedecinProfile; nav: SlotPanelProps['nav']; onAlerter: () => void }>) {
  const { goToDate, nextAvailableInfo, extendedLoading } = nav

  let action: React.ReactNode
  if (extendedLoading) {
    action = <div className="h-8 w-40 animate-pulse rounded-full bg-zinc-200" />
  } else if (nextAvailableInfo) {
    action = (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); goToDate(nextAvailableInfo.date) }}
        className="inline-flex items-center gap-2 rounded-full bg-[#007DFF] px-4 py-2 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#00263C] hover:scale-[1.02] active:scale-95"
      >
        <CalendarNextIcon />
        Prochaine dispo : {formatNextAvailable(nextAvailableInfo.date)}
      </button>
    )
  } else {
    action = (
      <Link
        href={`/medecins/${medecin.id}`}
        className="inline-flex items-center gap-1 rounded-full bg-[#EBF4FF] px-3 py-1.5 text-[11px] font-semibold text-[#1863A9] transition-colors hover:bg-[#D6EAFF]"
        onClick={(e) => e.stopPropagation()}
      >
        Voir le profil
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        </svg>
      </Link>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl bg-zinc-50 px-4 py-5 ring-1 ring-inset ring-zinc-100">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
        <CalendarOffIcon />
      </div>
      <div className="text-center">
        <p className="text-[12px] font-semibold text-zinc-500">Aucune dispo cette semaine</p>
      </div>
      {action}
      {/* L'agenda saturé est le moment où le besoin naît : proposer l'alerte ici
          évite au patient d'aller la chercher sur la page du médecin. */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onAlerter() }}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1863A9] underline underline-offset-2 transition-colors hover:text-[#007DFF]"
      >
        <BellIcon />
        Me prévenir si une place se libère
      </button>
    </div>
  )
}

function BellIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

/** Bande des cinq jours visibles, avec les flèches de navigation. */
function DayStrip({ nav }: Readonly<{ nav: SlotPanelProps['nav'] }>) {
  const { visibleDates, selectedDate, setSelectedDate, windowStart, setWindowStart, daysWithSlots } = nav

  return (
    <div className="mb-2.5 flex items-center gap-1">
      <button
        type="button"
        aria-label="Jours précédents"
        onClick={(e) => { e.preventDefault(); setWindowStart((w) => Math.max(0, w - 1)) }}
        disabled={windowStart === 0}
        className="flex shrink-0 h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-all hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeftIcon />
      </button>

      <div className="flex flex-1 gap-1">
        {visibleDates.map((date, i) => {
          const { day, date: d } = formatDayLabel(date)
          const isSelected = date === selectedDate
          const isToday = windowStart === 0 && i === 0
          return (
            <button
              key={date}
              type="button"
              onClick={(e) => { e.preventDefault(); setSelectedDate(date) }}
              className={`relative flex flex-1 flex-col items-center rounded-lg px-1 py-1 text-center transition-all duration-150 ${dayChipClass(isSelected, isToday)}`}
            >
              <span className="text-[9px] font-bold uppercase leading-tight">{day}</span>
              <span className="text-[13px] font-bold leading-tight">{d}</span>
              {daysWithSlots[i] && !isSelected && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-emerald-400" />
              )}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        aria-label="Jours suivants"
        onClick={(e) => { e.preventDefault(); setWindowStart((w) => Math.min(360, w + 1)) }}
        disabled={windowStart >= 360}
        className="flex shrink-0 h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-all hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRightIcon />
      </button>
    </div>
  )
}

/** Créneaux réservables du jour choisi : squelette, message vide, ou pastilles horaires. */
function SlotChips({ medecin, onBookSlot, nav }: SlotPanelProps) {
  const { selectedDate, showAll, setShowAll, isLoading, availableSlots, isUnavailable } = nav
  const MAX_CHIPS = 6

  if (isLoading) {
    return (
      <div className="grid w-full grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded-lg bg-zinc-100" />
        ))}
      </div>
    )
  }

  if (isUnavailable) {
    return (
      <div className="flex w-full items-center justify-center rounded-lg bg-zinc-50 px-3 py-3 ring-1 ring-inset ring-zinc-100">
        <span className="text-[11px] font-medium text-zinc-400">Aucune dispo ce jour</span>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-1.5">
        {(showAll ? availableSlots : availableSlots.slice(0, MAX_CHIPS)).map((s) => (
          <button
            key={s.debut}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onBookSlot?.({ medecin, date: selectedDate, debut: s.debut, fin: s.fin })
            }}
            className="min-w-[52px] flex-1 rounded-lg bg-[#EBF4FF] py-1.5 text-[13px] font-bold text-[#007DFF] transition-colors hover:bg-[#007DFF] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/40 cursor-pointer"
          >
            {s.debut}
          </button>
        ))}
      </div>
      {availableSlots.length > MAX_CHIPS && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAll((v) => !v) }}
          className="mt-2 w-full text-center text-[12px] font-semibold text-[#007DFF] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/40 rounded cursor-pointer"
        >
          {showAll ? 'Voir moins' : `Voir plus (${availableSlots.length - MAX_CHIPS} créneaux)`}
        </button>
      )}
    </div>
  )
}

/**
 * Panneau de réservation d'une carte de résultat.
 *
 * <p>Les deux états — agenda saturé ou créneaux à choisir — n'ont ni la même structure
 * ni les mêmes données. Les tenir dans une seule fonction la rendait trop touffue pour
 * être relue ; chacun vit désormais dans son composant.
 */
function SlotPanel({ medecin, onBookSlot, nav, onAlerter }: SlotPanelProps & { onAlerter: () => void }) {
  return (
    <div className="flex w-full shrink-0 flex-col border-t border-zinc-100 px-4 py-3.5 sm:w-[280px] sm:border-t-0 sm:border-l">
      {nav.allUnavailable ? (
        <NoAvailability medecin={medecin} nav={nav} onAlerter={onAlerter} />
      ) : (
        <>
          <DayStrip nav={nav} />
          <div className="flex flex-1 items-start">
            <SlotChips medecin={medecin} onBookSlot={onBookSlot} nav={nav} />
          </div>
        </>
      )}
    </div>
  )
}

interface MedecinCardListProps {
  readonly medecin: MedecinProfile
  readonly distanceKm?: number
  readonly onMouseEnter?: () => void
  readonly onMouseLeave?: () => void
  readonly onBookSlot?: (slot: BookingSlot) => void
}

export function MedecinCardList({ medecin, distanceKm, onMouseEnter, onMouseLeave, onBookSlot }: MedecinCardListProps) {
  const accepte = medecin.acceptNouveauxPatients !== false
  // L'état des créneaux est passé tel quel au panneau, seul consommateur.
  const nav = useCreneauxNavigation(medecin.id)

  const [alerteOuverte, setAlerteOuverte] = useState(false)
  const session = useSession()
  const patientId = session?.role === 'PATIENT' ? (session.id ?? null) : null

  return (
    <div
      className="group relative mb-3 rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.07)] transition-all duration-200 hover:shadow-[0_6px_28px_rgba(0,125,255,0.11)] overflow-hidden border border-transparent hover:border-[#007DFF]/10"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Left accent bar */}
      <div aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-[#007DFF] to-[#3DA8FF] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="flex flex-col sm:flex-row sm:items-stretch">

        {/* ── Doctor info ─────────────────────────────── */}
        <Link href={`/medecins/${medecin.id}`} className="relative flex min-w-0 flex-1 gap-4 px-5 py-4 overflow-hidden">
          {/* Gradient background blob */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 120px 100px at top right, rgba(0,125,255,0.06) 0%, transparent 70%)',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: 'radial-gradient(ellipse 160px 130px at top right, rgba(0,125,255,0.09) 0%, transparent 70%)',
            }}
          />

          {/* Avatar */}
          <div className="relative shrink-0 self-start mt-0.5">
            <div className="rounded-full ring-2 ring-offset-2 ring-[#B6DAF7]">
              <MedecinAvatar
                firstName={medecin.firstName}
                lastName={medecin.lastName}
                photoUrl={medecin.photoUrl ?? null}
                size="lg"
              />
            </div>
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
                {[medecin.adresse, medecin.ville].filter(Boolean).join(', ') || medecin.ville || '-'}
                {distanceKm !== undefined && (
                  <span className="ml-1 font-medium text-[#007DFF]">
                    · {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
                  </span>
                )}
              </p>
            </div>

            {/* Tags — anchored to bottom */}
            <div className="flex flex-wrap items-center gap-1.5">
              {!accepte && (
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

        <SlotPanel medecin={medecin} onBookSlot={onBookSlot} nav={nav} onAlerter={() => setAlerteOuverte(true)} />
      </div>

      {alerteOuverte && (
        <ListeAttenteDialog
          medecinId={medecin.id}
          patientId={patientId}
          medecinNom={`Dr. ${medecin.firstName} ${medecin.lastName}`}
          returnUrl="/recherche"
          onClose={() => setAlerteOuverte(false)}
        />
      )}
    </div>
  )
}
