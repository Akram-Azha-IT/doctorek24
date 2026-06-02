'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { useMedecin } from '@/features/annuaire/hooks'
import { useCreneaux } from '@/features/agenda/hooks'
import { CalendarPicker } from '@/features/agenda/components/CalendarPicker'
import { TimeSlotList } from '@/features/agenda/components/TimeSlotList'
import { ConfirmRdvForm } from '@/features/agenda/components/ConfirmRdvForm'
import { RdvSuccessCard } from '@/features/agenda/components/RdvSuccessCard'
import { Badge } from '@/components/ui/badge'
import type { Creneau, RendezVous } from '@/lib/types'

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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
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
  const [selectedCreneau, setSelectedCreneau] = useState<Creneau | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmedRdv, setConfirmedRdv] = useState<RendezVous | null>(null)

  const dateISO = selectedDate ? toISO(selectedDate) : ''

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

  function handleSelectDate(date: Date | undefined) {
    setSelectedDate(date)
    setSelectedCreneau(null)
    setShowForm(false)
    setConfirmedRdv(null)
  }

  function handleSelectCreneau(c: Creneau) {
    setSelectedCreneau(c)
    setShowForm(false)
    setConfirmedRdv(null)
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        {/* Back link */}
        <Link
          href={`/medecins/${id}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-8 transition-colors"
        >
          ← Retour au profil
        </Link>

        {/* Doctor header */}
        {loadingMedecin ? (
          <div className="h-8 w-48 bg-zinc-100 animate-pulse rounded mb-6" />
        ) : medecin ? (
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-1">Prendre rendez-vous avec</p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">
                Dr. {medecin.firstName} {medecin.lastName}
              </h1>
              <Badge>{medecin.specialite}</Badge>
            </div>
            <p className="text-sm text-zinc-500 mt-1">{medecin.ville}</p>
          </div>
        ) : null}

        {/* Two-column booking widget */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_260px]">
            {/* Left — calendar */}
            <div className="p-6">
              <p className="text-sm font-semibold text-zinc-900 mb-4">Choisir une date</p>
              <CalendarPicker
                selected={selectedDate}
                onSelect={handleSelectDate}
                disabledDays={isPast}
              />
            </div>

            {/* Divider */}
            <div className="hidden md:block bg-zinc-100" />

            {/* Right — time slots */}
            <div className="p-6 md:overflow-y-auto md:max-h-[480px]">
              <TimeSlotList
                creneaux={creneaux}
                selected={selectedCreneau?.debut ?? null}
                onSelect={handleSelectCreneau}
                isLoading={loadingCreneaux}
                isError={isError}
                dateLabel={selectedDate ? formatDateLabel(selectedDate) : ''}
              />
            </div>
          </div>
        </div>

        {/* Selected slot summary + confirm button */}
        {selectedCreneau && !showForm && !confirmedRdv && (
          <div className="mt-6 p-4 border border-zinc-200 rounded-xl bg-zinc-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-500">Créneau sélectionné</p>
              <p className="font-semibold text-zinc-900 capitalize">
                {selectedDate ? formatDateLabel(selectedDate) : ''} à {selectedCreneau.debut}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Durée estimée : jusqu&apos;à {selectedCreneau.fin}
              </p>
            </div>
            <button
              className="shrink-0 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
              onClick={() => setShowForm(true)}
            >
              Confirmer ce créneau
            </button>
          </div>
        )}

        {/* Confirmation form */}
        {selectedCreneau && showForm && !confirmedRdv && medecin && (
          <ConfirmRdvForm
            medecinId={id}
            medecinName={`Dr. ${medecin.firstName} ${medecin.lastName}`}
            dateRdv={dateISO}
            heureRdv={selectedCreneau.debut}
            heureFin={selectedCreneau.fin}
            onSuccess={(rdv) => {
              setConfirmedRdv(rdv)
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Success card */}
        {confirmedRdv && medecin && (
          <RdvSuccessCard
            rdv={confirmedRdv}
            medecinName={`Dr. ${medecin.firstName} ${medecin.lastName}`}
          />
        )}
      </main>
    </>
  )
}
