'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { MedecinAvatar } from '@/features/annuaire/components/MedecinAvatar'
import { useMedecin } from '@/features/annuaire/hooks'
import { useCreneaux } from '@/features/agenda/hooks'
import { CalendarPicker } from '@/features/agenda/components/CalendarPicker'
import { ListeAttenteCard } from '@/features/agenda/components/ListeAttenteCard'
import { useSession } from '@/lib/useSession'
import { TimeSlotList } from '@/features/agenda/components/TimeSlotList'
import { BookingDrawer } from '@/features/agenda/components/BookingDrawer'
import type { BookingSlot, Creneau } from '@/lib/types'

const DAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

function toISO(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function today(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function isPast(date: Date): boolean {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return date < t
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default function RdvPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today())
  const [bookingSlot, setBookingSlot] = useState<BookingSlot | null>(null)

  const session = useSession()
  const patientId = session?.role === 'PATIENT' ? (session.id ?? '') : ''

  const dateISO = selectedDate ? toISO(selectedDate) : ''

  // Mobile date strip: next 14 days
  const mobileDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + i); return d
  })

  const { data: medecin, isLoading: loadingMedecin } = useMedecin(id)
  const { data: rawCreneaux = [], isLoading: loadingCreneaux, isError } = useCreneaux(id, dateISO)

  const creneaux = (() => {
    const now = new Date()
    if (dateISO !== toISO(now)) return rawCreneaux
    return rawCreneaux.filter((c) => {
      const [h, m] = c.debut.split(':').map(Number)
      const slot = new Date()
      slot.setHours(h, m, 0, 0)
      return slot > now
    })
  })()

  function handleSelectCreneau(c: Creneau) {
    if (!medecin || !selectedDate) return
    setBookingSlot({
      medecin,
      date: dateISO,
      debut: c.debut,
      fin: c.fin,
    })
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8" id="main-content">

        {/* Back link */}
        <Link
          href={`/medecins/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] rounded"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour au profil
        </Link>

        {/* Doctor header */}
        {loadingMedecin ? (
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-full bg-zinc-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-48 bg-zinc-100 animate-pulse rounded" />
              <div className="h-4 w-32 bg-zinc-100 animate-pulse rounded" />
            </div>
          </div>
        ) : medecin ? (
          <div className="flex items-center gap-4 mb-8">
            <div className="shrink-0 ring-2 ring-[#007DFF]/15 rounded-full overflow-hidden">
              <MedecinAvatar
                firstName={medecin.firstName}
                lastName={medecin.lastName}
                photoUrl={(medecin as { photoUrl?: string | null }).photoUrl}
                size="lg"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#007DFF] uppercase tracking-wider mb-0.5">
                Prendre rendez-vous
              </p>
              <h1 className="text-xl font-bold text-zinc-900">
                Dr. {medecin.firstName} {medecin.lastName}
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {medecin.specialite}{medecin.ville ? ` · ${medecin.ville}` : ''}
              </p>
            </div>
          </div>
        ) : null}

        {/* Booking widget */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">

          {/* Step indicator */}
          <div className="flex items-center gap-2 px-4 md:px-6 py-4 border-b border-zinc-100 bg-zinc-50/60">
            <Step n={1} label="Choisir une date" active />
            <div className="flex-1 h-px bg-zinc-200" aria-hidden="true" />
            <Step n={2} label="Choisir un horaire" active={!!selectedDate} />
            <div className="flex-1 h-px bg-zinc-200" aria-hidden="true" />
            <Step n={3} label="Confirmer" active={false} />
          </div>

          {/* Mobile-only: horizontal date chip strip */}
          <div className="md:hidden border-b border-zinc-100 bg-white">
            <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none" style={{ touchAction: 'pan-x' }}>
              {mobileDates.map((d) => {
                const iso = toISO(d)
                const isSelected = selectedDate ? toISO(selectedDate) === iso : false
                const t = new Date()
                t.setHours(0,0,0,0)
                const isToday = d.getTime() === t.getTime()
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => { setSelectedDate(d); setBookingSlot(null) }}
                    aria-label={formatDateLabel(d)}
                    aria-pressed={isSelected}
                    className={`cursor-pointer shrink-0 flex flex-col items-center rounded-xl px-3 py-2 min-w-[52px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] ${
                      isSelected
                        ? 'bg-[#007DFF] text-white shadow-sm'
                        : isToday
                          ? 'bg-[#EBF4FF] text-[#1863A9]'
                          : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wide leading-tight">
                      {DAY_SHORT[d.getDay()]}
                    </span>
                    <span className="text-[17px] font-bold leading-snug">{d.getDate()}</span>
                    <span className={`text-[10px] leading-tight ${isSelected ? 'opacity-75' : 'text-zinc-400'}`}>
                      {MONTH_SHORT[d.getMonth()]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_280px]">
            {/* Left — calendar (hidden on mobile, use date strip above) */}
            <div className="hidden md:block p-6">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Étape 1 : Sélectionnez une date
              </p>
              <CalendarPicker
                selected={selectedDate}
                onSelect={(d) => setSelectedDate(d)}
                disabledDays={isPast}
              />
            </div>

            {/* Divider */}
            <div className="hidden md:block bg-zinc-100" aria-hidden="true" />

            {/* Right — time slots */}
            <div className="p-4 md:p-6 md:overflow-y-auto md:max-h-[480px]">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                <span className="md:hidden">Étape 2 : </span>Choisissez un horaire
              </p>
              <TimeSlotList
                creneaux={creneaux}
                selected={null}
                onSelect={handleSelectCreneau}
                isLoading={loadingCreneaux}
                isError={isError}
                dateLabel={selectedDate ? formatDateLabel(selectedDate) : ''}
              />
              {!loadingCreneaux && creneaux.length > 0 && (
                <p className="mt-4 text-xs text-zinc-400 text-center">
                  Touchez un horaire pour confirmer
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Proposée après les créneaux : la liste d'attente est le recours quand
            aucune date ne convient, pas une alternative à la réservation. */}
        {patientId && (
          <div className="mt-6">
            <ListeAttenteCard
              medecinId={id}
              patientId={patientId}
              medecinNom={medecin ? `Dr. ${medecin.firstName} ${medecin.lastName}` : undefined}
            />
          </div>
        )}

      </main>

      {/* BookingDrawer — same as /recherche */}
      <BookingDrawer
        slot={bookingSlot}
        onClose={() => setBookingSlot(null)}
      />
    </>
  )
}

function Step({ n, label, active }: { n: number; label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
          active ? 'bg-[#007DFF] text-white' : 'bg-zinc-200 text-zinc-400'
        }`}
        aria-hidden="true"
      >
        {n}
      </span>
      <span className={`text-[12px] font-medium hidden sm:block ${active ? 'text-zinc-700' : 'text-zinc-400'}`}>
        {label}
      </span>
    </div>
  )
}
