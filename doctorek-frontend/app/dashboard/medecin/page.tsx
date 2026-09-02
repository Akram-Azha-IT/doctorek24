'use client'

import { useRouter } from 'next/navigation'
import { useRdvsMedecin, useDisponibilites } from '@/features/agenda/hooks'
import { useSession } from '@/lib/useSession'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { HeroBanner } from '@/features/medecin/dashboard/components/HeroBanner'
import { DailyOverviewPanel } from '@/features/medecin/dashboard/components/DailyOverviewPanel'
import { ActivityOverview } from '@/features/medecin/dashboard/components/ActivityOverview'
import { UpcomingAppointments } from '@/features/medecin/dashboard/components/UpcomingAppointments'
import { TodayTimeline } from '@/features/medecin/dashboard/components/TodayTimeline'
import { todayISO } from '@/features/medecin/dashboard/utils'

export default function MedecinDashboardPage() {
  useRoleGuard('MEDECIN')
  const router = useRouter()

  const session = useSession()
  const isMedecin = session?.role === 'MEDECIN' && !!session.id
  const medecinId = isMedecin ? session.id : ''
  const firstName = isMedecin ? (session.firstName ?? '') : ''
  const lastName = isMedecin ? (session.lastName ?? '') : ''

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
  const patientCount = new Set(allRdvs.map((rdv) => rdv.patientId)).size

  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())

  return (
    <div className="mx-auto max-w-[1240px] space-y-5 px-4 py-5 md:px-6 md:py-7">
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
          <DailyOverviewPanel
            todayCount={todayRdvs.length}
            weekCount={cettesSemaine}
            patientCount={patientCount}
            consultationMinutes={dureeMinutes}
            onAgenda={() => router.push('/dashboard/medecin/agenda')}
            onDisponibilites={() => router.push('/dashboard/medecin/disponibilites')}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,0.78fr)_minmax(0,1.22fr)]">
            <UpcomingAppointments rdvs={upcomingRdvs} today={today} />
            <ActivityOverview rdvs={allRdvs} disponibilites={allDispos} />
          </div>

          {todayRdvs.length > 0 && <TodayTimeline rdvs={todayRdvs} />}
        </>
      )}
    </div>
  )
}
