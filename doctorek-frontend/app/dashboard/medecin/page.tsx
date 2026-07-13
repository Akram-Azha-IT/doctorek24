'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock4, Users, TrendingUp } from 'lucide-react'
import { useRdvsMedecin, useDisponibilites } from '@/features/agenda/hooks'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { HeroBanner } from '@/features/medecin/dashboard/components/HeroBanner'
import { StatCard } from '@/features/medecin/dashboard/components/StatCard'
import { UpcomingAppointments } from '@/features/medecin/dashboard/components/UpcomingAppointments'
import { OccupationBar } from '@/features/medecin/dashboard/components/OccupationBar'
import { WeeklyChart } from '@/features/medecin/dashboard/components/WeeklyChart'
import { TodayTimeline } from '@/features/medecin/dashboard/components/TodayTimeline'
import { todayISO } from '@/features/medecin/dashboard/utils'

export default function MedecinDashboardPage() {
  useRoleGuard('MEDECIN')
  const router = useRouter()

  const [medecinId, setMedecinId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'MEDECIN' && session.id) {
      setMedecinId(session.id)
      setFirstName(session.firstName ?? '')
      setLastName(session.lastName ?? '')
    }
  }, [])

  const { data: rdvs } = useRdvsMedecin(medecinId)
  const { data: disponibilites } = useDisponibilites(medecinId)

  const today = todayISO()
  const allRdvs = rdvs ?? []
  const allDispos = disponibilites ?? []
  const todayRdvs = allRdvs.filter((r) => r.dateRdv === today)
  const dureeMinutes = todayRdvs.reduce((sum, r) => sum + (r.duree ?? 0), 0)
  const cettesSemaine = allRdvs.filter((r) => {
    const d = new Date(r.dateRdv + 'T00:00:00')
    const now = new Date()
    const end = new Date(now); end.setDate(now.getDate() + 7)
    return d >= now && d <= end && r.statut !== 'ANNULE'
  }).length
  const upcomingRdvs = [...allRdvs]
    .filter((r) => r.dateRdv >= today && r.statut !== 'ANNULE')
    .sort((a, b) => a.dateRdv.localeCompare(b.dateRdv) || a.heureRdv.localeCompare(b.heureRdv))
    .slice(0, 6)

  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-6 md:py-7 space-y-5">
      <HeroBanner
        firstName={firstName}
        lastName={lastName}
        todayCount={todayRdvs.length}
        dateLabel={dateLabel}
        onAgenda={() => router.push('/dashboard/medecin/agenda')}
      />

      {!medecinId ? (
        <div className="rounded-2xl border border-dashed border-[#E5E9F0] bg-white py-20 text-center">
          <p className="text-sm text-[#A0AEC0]">Chargement…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="RDV aujourd'hui" value={todayRdvs.length} sub="Journée en cours" icon={<CalendarDays />} />
            <StatCard label="Cette semaine" value={cettesSemaine} sub="7 prochains jours" icon={<TrendingUp />} />
            <StatCard label="Patients suivis" value={new Set(allRdvs.map(r => r.patientId)).size} sub="Total" icon={<Users />} />
            <StatCard label="Temps de consultation" value={dureeMinutes} sub="Minutes aujourd'hui" icon={<Clock4 />} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
            <div className="space-y-4 min-w-0">
              <UpcomingAppointments rdvs={upcomingRdvs} today={today} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <OccupationBar rdvs={allRdvs} disponibilites={allDispos} />
                <WeeklyChart rdvs={allRdvs} />
              </div>
            </div>

            <TodayTimeline rdvs={todayRdvs} />
          </div>
        </>
      )}
    </div>
  )
}
