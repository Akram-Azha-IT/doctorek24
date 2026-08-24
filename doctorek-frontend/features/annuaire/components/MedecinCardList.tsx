'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MedecinAvatar } from './MedecinAvatar'
import { ListeAttenteDialog } from '@/features/agenda/components/ListeAttenteDialog'
import { useSession } from '@/lib/useSession'
import { NoteInline } from '@/features/avis/components/NoteInline'
import type { MedecinProfile, BookingSlot, NoteMedecin } from '@/lib/types'
import { useCreneauxNavigation } from '../useCreneauxNavigation'

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

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

function BellIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

/** Créneaux réservables du jour choisi : squelette, message vide, ou pastilles horaires. */
function SlotChips({ medecin, onBookSlot, nav }: SlotPanelProps) {
  const { selectedDate, showAll, setShowAll, isLoading, availableSlots, isUnavailable } = nav
  const MAX_CHIPS = 3

  if (isLoading) {
    return (
      <div className="grid w-full grid-cols-3 gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
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

function SlotPanel({ medecin, onBookSlot, nav, onAlerter }: SlotPanelProps & { onAlerter: () => void }) {
  const nextDifferentDate = nav.nextAvailableInfo?.date !== nav.selectedDate
    ? nav.nextAvailableInfo
    : null

  return (
    <div className="flex w-full shrink-0 flex-col justify-center border-t border-[#E7EDF4] bg-[#FCFDFE] px-5 py-4 sm:w-[320px] sm:border-l sm:border-t-0">
      {nav.isLoading ? (
        <>
          <div className="mb-3 h-4 w-40 animate-pulse rounded bg-zinc-100" />
          <SlotChips medecin={medecin} onBookSlot={onBookSlot} nav={nav} />
        </>
      ) : !nav.isUnavailable ? (
        <>
          <div className="mb-3">
            <p className="flex items-center gap-2 text-[13px] font-bold text-[#15935A]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2EB67D]" aria-hidden="true" />
              Disponible · {formatNextAvailable(nav.selectedDate)}
            </p>
            <p className="ml-[18px] mt-0.5 text-[11px] text-[#7A8795]">Choisissez un horaire</p>
          </div>
          <SlotChips medecin={medecin} onBookSlot={onBookSlot} nav={nav} />
          <Link
            href={`/medecins/${medecin.id}/rdv?date=${nav.selectedDate}`}
            className="mt-3 flex min-h-9 items-center justify-center rounded-lg border border-[#9CCEFF] bg-white px-3 text-xs font-bold text-[#007DFF] transition-colors hover:bg-[#EBF4FF]"
          >
            Voir les disponibilités
          </Link>
        </>
      ) : (
        <>
          <p className={`flex items-center gap-2 text-[13px] font-bold ${nextDifferentDate ? 'text-[#D47B00]' : 'text-[#E01E5A]'}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${nextDifferentDate ? 'bg-[#ECB22E]' : 'bg-[#E01E5A]'}`} aria-hidden="true" />
            {nextDifferentDate
              ? `Prochain créneau ${formatNextAvailable(nextDifferentDate.date)}`
              : 'Aucune disponibilité cette semaine'}
          </p>
          <p className="ml-[18px] mt-1 text-[11px] text-[#7A8795]">
            {nextDifferentDate ? `Première place à ${nextDifferentDate.heure}` : 'Aucun créneau trouvé sur les prochains jours'}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {nextDifferentDate && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  nav.goToDate(nextDifferentDate.date)
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#9CCEFF] bg-white px-3 text-xs font-bold text-[#007DFF] transition-colors hover:bg-[#EBF4FF]"
              >
                <CalendarNextIcon />
                Voir ce créneau
              </button>
            )}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onAlerter()
              }}
              className="inline-flex min-h-9 items-center gap-1.5 px-1 text-xs font-semibold text-[#1863A9] underline underline-offset-2 hover:text-[#007DFF]"
            >
              <BellIcon />
              Me prévenir
            </button>
          </div>
        </>
      )}
    </div>
  )
}

interface MedecinCardListProps {
  readonly medecin: MedecinProfile
  /** Absente tant que les notes de la page chargent, ou si le médecin n'a aucun avis. */
  readonly note?: NoteMedecin
  readonly distanceKm?: number
  readonly onMouseEnter?: () => void
  readonly onMouseLeave?: () => void
  readonly onBookSlot?: (slot: BookingSlot) => void
  readonly searchDate?: string | null
}

export function MedecinCardList({ medecin, note, distanceKm, onMouseEnter, onMouseLeave, onBookSlot, searchDate }: MedecinCardListProps) {
  const accepte = medecin.acceptNouveauxPatients !== false
  // L'état des créneaux est passé tel quel au panneau, seul consommateur.
  const nav = useCreneauxNavigation(medecin.id, searchDate)

  const [alerteOuverte, setAlerteOuverte] = useState(false)
  const session = useSession()
  const patientId = session?.role === 'PATIENT' ? (session.id ?? null) : null

  return (
    <div
      className="group relative mb-3 overflow-hidden rounded-xl border border-[#DCE5EE] bg-white shadow-[0_3px_12px_rgba(1,38,81,0.055)] transition-all duration-200 hover:border-[#B6DAF7] hover:shadow-[0_9px_26px_rgba(1,38,81,0.09)]"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Left accent bar */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-1 rounded-l-xl bg-[#007DFF] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="flex flex-col sm:flex-row sm:items-stretch">

        {/* ── Doctor info ─────────────────────────────── */}
        <Link href={`/medecins/${medecin.id}`} className="relative flex min-w-0 flex-1 gap-4 overflow-hidden px-5 py-4">
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

              {/* Specialty + note : la qualité se lit avec la spécialité, pas dans un coin */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <p className="text-[13px] font-semibold text-[#007DFF]">{medecin.specialite}</p>
                <NoteInline note={note} />
              </div>

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
