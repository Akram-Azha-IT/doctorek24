'use client'

import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  FileText,
  MapPin,
  MessageCircleMore,
  Stethoscope,
} from 'lucide-react'
import { useMedecin } from '@/features/annuaire/hooks'
import { MedecinAvatar } from '@/features/annuaire/components/MedecinAvatar'
import { openAgent } from '@/features/agent/events'
import type { RendezVous } from '@/lib/types'

interface CareJourneyProps {
  todayRdv: RendezVous | undefined
  nextRdv: RendezVous | undefined
  latestCompleted: RendezVous | undefined
}

function formatLongDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function doctorLabel(firstName?: string, lastName?: string): string {
  return firstName && lastName ? `Dr ${firstName} ${lastName}` : 'Votre médecin'
}

export function CareJourney({ todayRdv, nextRdv, latestCompleted }: CareJourneyProps) {
  const { data: nextDoctor } = useMedecin(nextRdv?.medecinId ?? '')
  const { data: latestDoctor } = useMedecin(latestCompleted?.medecinId ?? '')

  const nextDoctorName = doctorLabel(nextDoctor?.firstName, nextDoctor?.lastName)
  const latestDoctorName = doctorLabel(latestDoctor?.firstName, latestDoctor?.lastName)

  return (
    <section className="rounded-[22px] border border-[#DCE7F3] bg-white px-5 py-5 shadow-[0_10px_32px_rgba(0,38,60,0.06)] sm:px-7 sm:py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#007DFF]">Votre essentiel</p>
          <h2 className="mt-1 text-xl font-bold tracking-[-0.02em] text-[#010C2D]">Mon parcours de soins</h2>
        </div>
        <Link
          href="/dashboard/patient/rdvs"
          className="hidden items-center gap-1.5 text-sm font-semibold text-[#006EDC] transition-colors hover:text-[#00263C] sm:inline-flex"
        >
          Tout voir
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative ml-2 space-y-7 border-l border-[#C9D8E8] pl-7 sm:ml-3 sm:pl-9">
        <div className="relative">
          <span className="absolute -left-[35px] top-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-[#007DFF] ring-2 ring-[#CDE7FF] sm:-left-[43px]" />
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#007DFF]">Aujourd&apos;hui</p>
          <div className="flex gap-3 border-b border-[#E6EDF5] pb-6 sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF6FF] text-[#007DFF]">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#010C2D]">
                {todayRdv ? `Rendez-vous à ${todayRdv.heureRdv}` : 'Aucun rendez-vous prévu'}
              </p>
              <p className="mt-1 text-sm leading-5 text-[#5D6B7A]">
                {todayRdv
                  ? todayRdv.motif || 'Votre prochaine consultation est prévue aujourd’hui.'
                  : 'Votre journée est libre. Nous restons disponibles si vous avez besoin de soins.'}
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <span className="absolute -left-[36px] top-0.5 h-4 w-4 rounded-full border-[3px] border-white bg-[#2EB67D] ring-2 ring-[#CDEEDF] sm:-left-[44px]" />
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#208A62]">Prochain rendez-vous</p>

          {nextRdv ? (
            <div className="rounded-2xl border border-[#BFE8D4] bg-[#F7FCF9] p-4 sm:p-5">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="flex min-w-0 gap-3.5">
                  {nextDoctor ? (
                    <MedecinAvatar
                      firstName={nextDoctor.firstName}
                      lastName={nextDoctor.lastName}
                      photoUrl={nextDoctor.photoUrl}
                      size="md"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#007DFF] ring-1 ring-[#DCE7F3]">
                      <Stethoscope className="h-5 w-5" aria-hidden="true" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-[#010C2D]">{nextDoctorName}</h3>
                    <p className="mt-0.5 text-sm font-medium text-[#006EDC]">
                      {nextDoctor?.specialite ?? nextRdv.motif ?? 'Consultation'}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-[#536477] sm:grid-cols-2">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-[#61758A]" aria-hidden="true" />
                        <span className="capitalize">{formatLongDate(nextRdv.dateRdv)}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 shrink-0 text-[#61758A]" aria-hidden="true" />
                        {nextRdv.heureRdv}
                      </span>
                      {nextDoctor && (nextDoctor.adresse || nextDoctor.ville) && (
                        <span className="flex items-start gap-2 sm:col-span-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#61758A]" aria-hidden="true" />
                          <span>{[nextDoctor.adresse, nextDoctor.ville].filter(Boolean).join(' · ')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 sm:justify-end lg:flex-col">
                  <button
                    type="button"
                    onClick={openAgent}
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#007DFF] px-4 text-sm font-bold text-white transition-colors hover:bg-[#006EDC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2 lg:flex-none"
                  >
                    <MessageCircleMore className="h-4 w-4" aria-hidden="true" />
                    Préparer
                  </button>
                  <Link
                    href="/dashboard/patient/rdvs"
                    className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-[#A8C4DF] bg-white px-4 text-sm font-bold text-[#005FBE] transition-colors hover:border-[#007DFF] hover:bg-[#F2F8FF] lg:flex-none"
                  >
                    Gérer
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-[#BFD1E3] bg-[#FBFDFF] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[#010C2D]">Aucun rendez-vous à venir</p>
                <p className="mt-1 text-sm text-[#5D6B7A]">Trouvez un praticien adapté à votre besoin.</p>
              </div>
              <Link
                href="/recherche"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#007DFF] px-4 text-sm font-bold text-white transition-colors hover:bg-[#006EDC]"
              >
                Trouver un médecin
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        <div className="relative">
          <span className="absolute -left-[35px] top-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-[#7890AA] ring-2 ring-[#E3EAF2] sm:-left-[43px]" />
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#64788E]">Dernière consultation</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0F4F8] text-[#64788E]">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#010C2D]">
                  {latestCompleted ? latestDoctorName : 'Aucune consultation passée'}
                </p>
                <p className="mt-1 text-sm text-[#5D6B7A]">
                  {latestCompleted
                    ? `${formatLongDate(latestCompleted.dateRdv)} · ${latestCompleted.motif ?? latestDoctor?.specialite ?? 'Consultation'}`
                    : 'Votre historique apparaîtra ici après votre première consultation.'}
                </p>
              </div>
            </div>
            {latestCompleted && (
              <Link
                href="/dashboard/patient/rdvs"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#006EDC] hover:text-[#00263C]"
              >
                Voir le détail
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
