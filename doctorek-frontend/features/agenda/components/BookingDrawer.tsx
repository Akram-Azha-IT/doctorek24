'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MedecinAvatar } from '@/features/annuaire/components/MedecinAvatar'
import { ConfirmRdvForm } from './ConfirmRdvForm'
import { getSession } from '@/lib/session'
import type { BookingSlot, RendezVous } from '@/lib/types'

interface BookingDrawerProps {
  slot: BookingSlot | null
  onClose: () => void
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso + 'T00:00:00'))
}

function CheckCircleIcon() {
  return (
    <svg className="h-14 w-14 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

export function BookingDrawer({ slot, onClose }: BookingDrawerProps) {
  const [visible, setVisible] = useState(false)
  const [confirmedRdv, setConfirmedRdv] = useState<RendezVous | null>(null)
  const prevSlotRef = useRef<BookingSlot | null>(null)

  // Reset success state when a new slot is opened
  useEffect(() => {
    if (slot && slot !== prevSlotRef.current) {
      setConfirmedRdv(null)
      prevSlotRef.current = slot
    }
  }, [slot])

  // Animate in/out
  useEffect(() => {
    if (!slot) {
      setVisible(false)
      return
    }
    // Double rAF so CSS transitions pick up the class change
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true))
    )
    return () => cancelAnimationFrame(id)
  }, [slot])

  // Body scroll lock
  useEffect(() => {
    if (slot) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [slot])

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function handleClose() {
    setVisible(false)
    // Wait for transition before unmounting
    setTimeout(onClose, 300)
  }

  if (!slot) return null

  const { medecin } = slot
  const doctorName = `Dr. ${medecin.firstName} ${medecin.lastName}`

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel — bottom sheet on mobile, right panel on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Prise de rendez-vous avec ${doctorName}`}
        className={`fixed z-50 bg-white shadow-2xl transition-transform duration-300 ease-out
          /* mobile: bottom sheet */
          bottom-0 left-0 right-0 rounded-t-3xl max-h-[92dvh] overflow-y-auto
          /* desktop: right side panel */
          md:bottom-0 md:right-0 md:left-auto md:top-0 md:h-full md:w-[480px] md:rounded-none md:rounded-l-3xl md:max-h-none
          ${visible
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full'
          }`}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="h-1.5 w-12 rounded-full bg-zinc-200" />
        </div>

        {/* Desktop close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 hidden md:flex items-center justify-center h-9 w-9 rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900"
          aria-label="Fermer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col">

          {/* Doctor header — blue gradient */}
          <div className="bg-gradient-to-br from-[#007DFF] to-[#064178] px-6 pt-4 pb-6 md:pt-8">
            <div className="flex items-center gap-4">
              <div className="shrink-0 ring-2 ring-white/30 rounded-full">
                <MedecinAvatar
                  firstName={medecin.firstName}
                  lastName={medecin.lastName}
                  photoUrl={medecin.photoUrl ?? null}
                  size="lg"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">
                  Prise de rendez-vous
                </p>
                <p className="mt-0.5 text-lg font-bold text-white truncate">{doctorName}</p>
                <p className="text-sm text-blue-100 truncate">{medecin.specialite}</p>
              </div>
            </div>

            {/* Appointment chip */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm ring-1 ring-white/20">
              <div className="flex items-center gap-1.5 text-white">
                <CalendarIcon />
                <span className="text-sm font-medium capitalize">{formatDate(slot.date)}</span>
              </div>
              <div className="h-4 w-px bg-white/30" />
              <div className="flex items-center gap-1.5 text-white">
                <ClockIcon />
                <span className="text-sm font-medium">{slot.debut} – {slot.fin}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {confirmedRdv ? (
              <SuccessState rdv={confirmedRdv} onClose={handleClose} />
            ) : getSession()?.role === 'PATIENT' ? (
              <ConfirmRdvForm
                medecinId={medecin.id}
                medecinName={doctorName}
                dateRdv={slot.date}
                heureRdv={slot.debut}
                heureFin={slot.fin}
                embedded
                onSuccess={(rdv) => setConfirmedRdv(rdv)}
                onCancel={handleClose}
              />
            ) : (
              <LoginPrompt onClose={handleClose} slot={slot} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function LoginPrompt({ onClose, slot }: { onClose: () => void; slot: BookingSlot }) {
  const returnUrl = encodeURIComponent(
    `/recherche?bookMedecinId=${slot.medecin.id}&bookDate=${slot.date}&bookDebut=${encodeURIComponent(slot.debut)}&bookFin=${encodeURIComponent(slot.fin)}`
  )
  return (
    <div className="flex flex-col items-center text-center py-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EBF4FF]">
        <svg className="h-8 w-8 text-[#007DFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>

      <h2 className="mt-4 text-lg font-bold text-zinc-900">Connexion requise</h2>
      <p className="mt-2 text-sm text-zinc-500 max-w-xs">
        Connectez-vous à votre compte patient pour prendre ce rendez-vous avec{' '}
        <span className="font-medium text-zinc-700">
          Dr. {slot.medecin.firstName} {slot.medecin.lastName}
        </span>.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3">
        <a
          href={`/login?redirect=${returnUrl}`}
          className="flex w-full items-center justify-center rounded-xl bg-[#007DFF] py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#00263C]"
        >
          Se connecter
        </a>
        <Link
          href="/inscription"
          className="flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          Créer un compte
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-1 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

function SuccessState({ rdv, onClose }: { rdv: RendezVous; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <CheckCircleIcon />
      <h2 className="mt-4 text-xl font-bold text-zinc-900">Rendez-vous confirmé !</h2>
      <p className="mt-1.5 text-sm text-zinc-500 max-w-xs">
        Votre rendez-vous a été enregistré. Vous pouvez le retrouver dans votre espace patient.
      </p>

      <div className="mt-6 w-full rounded-2xl bg-zinc-50 border border-zinc-100 px-5 py-4 text-left">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Récapitulatif</p>
        <div className="flex flex-col gap-2">
          <Row label="Date" value={formatDateLong(rdv.dateRdv)} />
          <Row label="Heure" value={rdv.heureRdv} />
          <Row label="Durée" value={`${rdv.duree} min`} />
          {rdv.motif && <Row label="Motif" value={rdv.motif} />}
        </div>
      </div>

      <div className="mt-6 flex w-full flex-col gap-3">
        <Link
          href="/patient/rdvs"
          className="flex w-full items-center justify-center rounded-xl bg-[#007DFF] py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#00263C]"
        >
          Voir mes rendez-vous
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          Continuer la recherche
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-zinc-400 shrink-0">{label}</span>
      <span className="text-sm font-medium text-zinc-800 text-right">{value}</span>
    </div>
  )
}

function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso + 'T00:00:00'))
}
