'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, MapPin, ShieldCheck } from 'lucide-react'
import { useRdvsPatient } from '@/features/agenda/hooks'
import { useCarteByPatient } from '@/features/carte/hooks'
import { usePatientProfile } from '@/features/patient/hooks'
import { CareJourney } from '@/features/patient/dashboard/components/CareJourney'
import { DashboardActions } from '@/features/patient/dashboard/components/DashboardActions'
import { DashboardHealthRail } from '@/features/patient/dashboard/components/DashboardHealthRail'
import { selectDashboardRdvs } from '@/features/patient/dashboard/utils'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'

function contextualDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default function DashboardPatientPage() {
  useRoleGuard('PATIENT')

  const [patientId, setPatientId] = useState('')
  const [firstName, setFirstName] = useState<string | null>(null)
  const [lastName, setLastName] = useState<string | null>(null)

  useEffect(() => {
    function syncFromSession() {
      const session = getSession()
      if (session?.role === 'PATIENT' && session.id) {
        setPatientId(session.id)
        setFirstName(session.firstName ?? null)
        setLastName(session.lastName ?? null)
      }
    }

    syncFromSession()
    window.addEventListener('session-updated', syncFromSession)
    return () => window.removeEventListener('session-updated', syncFromSession)
  }, [])

  const { data: rdvs = [], isLoading: rdvsLoading } = useRdvsPatient(patientId)
  const { data: carte, isLoading: carteLoading } = useCarteByPatient(patientId || null)
  const { data: profile } = usePatientProfile(patientId || null)

  const now = useMemo(() => new Date(), [])
  const dashboardRdvs = useMemo(() => selectDashboardRdvs(rdvs, now), [rdvs, now])
  const city = profile?.adresseVille?.trim()
  const activeCount = dashboardRdvs.active.length

  if (!patientId || rdvsLoading) {
    return <DashboardSkeleton />
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-7 lg:pb-10">
      <header className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-[#010C2D] sm:text-[34px]">
              Salam {firstName ?? 'Patient'},
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[#52667B]">
              <span className="flex items-center gap-2 capitalize" suppressHydrationWarning>
                <CalendarDays className="h-4 w-4 text-[#007DFF]" aria-hidden="true" />
                {contextualDate(now)}
              </span>
              {city && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#007DFF]" aria-hidden="true" />
                  {city}
                </span>
              )}
            </div>
          </div>

          <p className="flex items-center gap-2 text-sm font-medium text-[#3E566D]">
            <ShieldCheck className="h-4 w-4 text-[#2EB67D]" aria-hidden="true" />
            {activeCount === 0
              ? 'Votre parcours est à jour'
              : `${activeCount} rendez-vous à venir`}
          </p>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="min-w-0 space-y-5">
          <CareJourney
            todayRdv={dashboardRdvs.today}
            nextRdv={dashboardRdvs.next}
            latestCompleted={dashboardRdvs.latestCompleted}
          />
          <DashboardActions />
        </div>

        <DashboardHealthRail
          carte={carte}
          carteLoading={carteLoading}
          profile={profile}
          firstName={firstName}
          lastName={lastName}
        />
      </div>
    </main>
  )
}

function DashboardSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-7 lg:pb-10" aria-label="Chargement du tableau de bord">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-[#E4ECF4]" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-[#E8EFF6]" />
      <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="h-[520px] animate-pulse rounded-[22px] border border-[#DCE7F3] bg-white" />
          <div className="h-40 animate-pulse rounded-[22px] border border-[#DCE7F3] bg-white" />
        </div>
        <div className="space-y-5">
          <div className="h-[390px] animate-pulse rounded-[22px] border border-[#DCE7F3] bg-white" />
          <div className="h-[360px] animate-pulse rounded-[22px] border border-[#DCE7F3] bg-white" />
        </div>
      </div>
    </main>
  )
}
