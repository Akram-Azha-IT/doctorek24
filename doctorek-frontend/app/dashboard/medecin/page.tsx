'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, CheckCircle2, Clock4, XCircle, X } from 'lucide-react'
import { useRdvsMedecin, useDisponibilites } from '@/features/agenda/hooks'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { HeroBanner } from '@/features/medecin/dashboard/components/HeroBanner'
import { StatCard } from '@/features/medecin/dashboard/components/StatCard'
import { UpcomingAppointments } from '@/features/medecin/dashboard/components/UpcomingAppointments'
import { OccupationBar } from '@/features/medecin/dashboard/components/OccupationBar'
import { WeeklyChart } from '@/features/medecin/dashboard/components/WeeklyChart'
import { TodayTimeline } from '@/features/medecin/dashboard/components/TodayTimeline'
import { QuickActions } from '@/features/medecin/dashboard/components/QuickActions'
import { todayISO } from '@/features/medecin/dashboard/utils'

const DASH_MIN_LEFT = 340
const DASH_MAX_LEFT = 860
const DASH_DEFAULT_LEFT = 660

export default function MedecinDashboardPage() {
  useRoleGuard('MEDECIN')
  const router = useRouter()

  const [medecinId, setMedecinId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [leftWidth, setLeftWidth] = useState(DASH_DEFAULT_LEFT)
  const [isDragging, setIsDragging] = useState(false)
  const [showConseil, setShowConseil] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef(false)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setLeftWidth(Math.max(DASH_MIN_LEFT, Math.min(DASH_MAX_LEFT, e.clientX - rect.left)))
  }, [])

  const handleMouseUp = useCallback(() => {
    dragRef.current = false
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [handleMouseMove])

  function handleDividerMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    dragRef.current = true
    setIsDragging(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  useEffect(() => () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [handleMouseMove, handleMouseUp])

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
  const confirmes  = todayRdvs.filter((r) => r.statut === 'CONFIRME').length
  const enAttente  = todayRdvs.filter((r) => r.statut === 'EN_ATTENTE').length
  const annules    = todayRdvs.filter((r) => r.statut === 'ANNULE').length
  const upcomingRdvs = [...allRdvs]
    .filter((r) => r.dateRdv >= today && r.statut !== 'ANNULE')
    .sort((a, b) => a.dateRdv.localeCompare(b.dateRdv) || a.heureRdv.localeCompare(b.heureRdv))
    .slice(0, 6)

  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())

  return (
    <div className="px-6 py-6 space-y-5">
      <HeroBanner
        firstName={firstName}
        lastName={lastName}
        todayCount={todayRdvs.length}
        dateLabel={dateLabel}
        onAgenda={() => router.push('/dashboard/medecin/agenda')}
      />

      {!medecinId ? (
        <div
          className="rounded-2xl border border-dashed py-20 text-center"
          style={{ borderColor: '#E5E9F0', background: '#FFFFFF' }}
        >
          <p className="text-sm" style={{ color: '#A0AEC0' }}>Chargement…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="RDVs du jour" value={todayRdvs.length} sub="Tous statuts" iconColor="#007DFF" iconBg="#EBF4FF" icon={<CalendarDays className="h-5 w-5" />} />
            <StatCard label="Confirmés"    value={confirmes}         sub="Aujourd'hui"  iconColor="#2EB67D" iconBg="#E6F8F0" icon={<CheckCircle2 className="h-5 w-5" />} />
            <StatCard label="En attente"   value={enAttente}         sub="Aujourd'hui"  iconColor="#ECB22E" iconBg="#FFF8E6" icon={<Clock4 className="h-5 w-5" />} />
            <StatCard label="Annulés"      value={annules}           sub="Aujourd'hui"  iconColor="#E01E5A" iconBg="#FFEBEB" icon={<XCircle className="h-5 w-5" />} />
          </div>

          {showConseil && (
            <div
              className="rounded-2xl px-6 py-4 flex items-center gap-4 relative"
              style={{ background: '#EBF4FF', border: '1px solid #DFEFFE' }}
            >
              <div className="shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-xl" style={{ background: '#DFEFFE' }}>
                🩺
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: '#007DFF' }}>Conseil du jour</p>
                <p className="text-xs mt-0.5" style={{ color: '#356897' }}>
                  Planifiez des créneaux réguliers pour vos suivis patients et gagnez du temps au quotidien.
                </p>
              </div>
              <button
                onClick={() => setShowConseil(false)}
                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: '#3DA8FF' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#DFEFFE' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div ref={containerRef} className="flex items-start gap-0">
            <div className="shrink-0 space-y-4 min-w-0" style={{ width: leftWidth }}>
              <UpcomingAppointments rdvs={upcomingRdvs} today={today} />
              <div className="grid grid-cols-2 gap-4">
                <OccupationBar rdvs={allRdvs} disponibilites={allDispos} />
                <WeeklyChart rdvs={allRdvs} />
              </div>
            </div>

            <div
              onMouseDown={handleDividerMouseDown}
              className="group relative mx-3 flex w-1 self-stretch shrink-0 cursor-col-resize select-none items-center justify-center rounded-full transition-colors"
              style={{ background: isDragging ? '#007DFF' : '#E5E9F0' }}
              onMouseEnter={(e) => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = '#B6DAF7' }}
              onMouseLeave={(e) => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = '#E5E9F0' }}
            >
              <div className={`absolute z-10 flex flex-col gap-1 rounded-full bg-white px-1 py-2 shadow-sm ring-1 ring-[#E5E9F0] transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {[0, 1, 2].map((i) => <span key={i} className="block h-1 w-1 rounded-full" style={{ background: '#007DFF' }} />)}
              </div>
            </div>

            <div className="flex-1 min-w-[240px] space-y-4">
              <TodayTimeline rdvs={todayRdvs} />
              <QuickActions />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
