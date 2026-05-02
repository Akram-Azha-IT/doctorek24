'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRdvsMedecin, useDisponibilites } from '@/features/agenda/hooks'
import type { Disponibilite, RendezVous, StatutRdv } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { CalendarDays, CheckCircle2, Clock4, XCircle, TrendingUp, PenLine, Trash2 } from 'lucide-react'

const STATUT_LABELS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
}

const STATUT_BADGE: Record<StatutRdv, string> = {
  EN_ATTENTE: 'bg-[#FFF8E6] text-[#E59E00]',
  CONFIRME: 'bg-[#E6F8F0] text-[#009E60]',
  ANNULE: 'bg-[#FFEBEB] text-[#E01E5A]',
  TERMINE: 'bg-[#F4F4F5] text-[#71717A]',
}

function todayISO(): string {
  return localDateISO(new Date())
}

function localDateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekRange(): { monday: string; sunday: string } {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { monday: localDateISO(monday), sunday: localDateISO(sunday) }
}

function computeTotalWeekSlots(disponibilites: Disponibilite[]): number {
  return disponibilites.reduce((total, dispo) => {
    const [sh, sm] = dispo.heureDebut.split(':').map(Number)
    const [eh, em] = dispo.heureFin.split(':').map(Number)
    const minutes = eh * 60 + em - (sh * 60 + sm)
    return total + Math.floor(minutes / dispo.dureeConsultation)
  }, 0)
}

function patientName(rdv: RendezVous): string {
  if (rdv.patientPrenom || rdv.patientNom) {
    return `${rdv.patientPrenom ?? ''} ${rdv.patientNom ?? ''}`.trim()
  }
  return `Patient ${rdv.patientId.slice(0, 8)}…`
}

function patientInitials(rdv: RendezVous): string {
  if (rdv.patientPrenom || rdv.patientNom) {
    const p = rdv.patientPrenom?.charAt(0) ?? ''
    const n = rdv.patientNom?.charAt(0) ?? ''
    return (p + n).toUpperCase() || '?'
  }
  return rdv.patientId.slice(0, 2).toUpperCase()
}

// Deterministic hue from string
function avatarHue(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360
  return h
}

interface StatCardProps {
  label: string
  value: number
  sub: string
  icon: React.ReactNode
  iconBg: string
  active?: boolean
}

function StatCard({ label, value, sub, icon, iconBg, active }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl px-5 py-5 flex flex-col gap-3 shadow-sm transition-all ${
        active
          ? 'bg-[#E2F0FD] border border-transparent'
          : 'bg-white border border-zinc-100'
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? 'bg-white shadow-sm' : iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold leading-none text-[#010C2D]">{value}</p>
        <p className={`mt-1 text-xs font-semibold ${active ? 'text-[#1863A9]' : 'text-zinc-500'}`}>{label}</p>
        <p className={`mt-0.5 text-[11px] ${active ? 'text-[#1863A9]/70' : 'text-zinc-400'}`}>{sub}</p>
      </div>
    </div>
  )
}

const STATUT_DOT: Record<StatutRdv, string> = {
  CONFIRME: 'bg-[#2EB67D]',
  EN_ATTENTE: 'bg-[#ECB22E]',
  ANNULE: 'bg-[#E01E5A]',
  TERMINE: 'bg-zinc-400',
}

const STATUT_PILL: Record<StatutRdv, string> = {
  CONFIRME: 'bg-[#E6F8F0] text-[#009E60]',
  EN_ATTENTE: 'bg-[#FFF8E6] text-[#E59E00]',
  ANNULE: 'bg-[#FFEBEB] text-[#E01E5A]',
  TERMINE: 'bg-zinc-100 text-zinc-500',
}

function TodayTimeline({ rdvs }: { rdvs: RendezVous[] }) {
  const [nowMinutes, setNowMinutes] = useState(() => {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  })

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date()
      setNowMinutes(n.getHours() * 60 + n.getMinutes())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  const active = rdvs.filter((r) => r.statut !== 'ANNULE').sort((a, b) => a.heureRdv.localeCompare(b.heureRdv))

  const parseMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const allMins = active.map((r) => parseMin(r.heureRdv))
  const START = allMins.length ? Math.max(0, Math.min(...allMins) - 60) : 8 * 60
  const END = allMins.length ? Math.min(24 * 60, Math.max(...allMins) + 90) : 19 * 60
  const SPAN = END - START

  const toPercent = (min: number) => Math.max(0, Math.min(100, ((min - START) / SPAN) * 100))

  const nowPct = toPercent(nowMinutes)
  const nowVisible = nowMinutes >= START && nowMinutes <= END

  const hourMarks: number[] = []
  const startHour = Math.ceil(START / 60)
  const endHour = Math.floor(END / 60)
  for (let h = startHour; h <= endHour; h++) hourMarks.push(h)

  return (
    <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#010C2D]">Programme du jour</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {active.length === 0 ? 'Aucun rendez-vous' : `${active.length} rendez-vous`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-[#E2F0FD] px-3 py-1.5">
          <Clock4 className="h-3.5 w-3.5 text-[#1863A9]" />
          <span className="text-xs font-bold text-[#1863A9]">
            {String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:{String(nowMinutes % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="px-5 pb-8 pt-4 flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-[#F1F4F7] flex items-center justify-center">
            <CalendarDays className="h-7 w-7 text-zinc-300" />
          </div>
          <p className="text-xs text-zinc-400 text-center">Journée libre —<br />aucun rendez-vous aujourd'hui</p>
        </div>
      ) : (
        <div className="px-5 pb-5">
          {/* Timeline */}
          <div className="relative" style={{ height: 260 }}>
            {/* Hour marks */}
            {hourMarks.map((h) => {
              const pct = toPercent(h * 60)
              return (
                <div
                  key={h}
                  className="absolute left-0 right-0 flex items-center gap-2"
                  style={{ top: `${pct}%` }}
                >
                  <span className="text-[10px] font-semibold text-zinc-300 w-7 shrink-0 text-right leading-none">{h}h</span>
                  <div className="flex-1 h-px bg-zinc-100" />
                </div>
              )
            })}

            {/* Now line */}
            {nowVisible && (
              <div
                className="absolute left-0 right-0 z-20 flex items-center gap-2 pointer-events-none"
                style={{ top: `${nowPct}%` }}
              >
                <span className="w-7 shrink-0" />
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#E01E5A] shadow-[0_0_0_3px_rgba(224,30,90,0.2)] shrink-0 animate-pulse" />
                  <div className="flex-1 h-px bg-[#E01E5A]/40" />
                </div>
              </div>
            )}

            {/* Appointment dots */}
            {active.map((rdv) => {
              const min = parseMin(rdv.heureRdv)
              const pct = toPercent(min)
              const past = min < nowMinutes
              return (
                <div
                  key={rdv.id}
                  className="absolute left-0 right-0 z-10 flex items-center gap-2"
                  style={{ top: `${pct}%`, transform: 'translateY(-50%)' }}
                >
                  <span className="w-7 shrink-0" />
                  <div className="flex-1 flex items-center gap-2">
                    {/* Dot */}
                    <span
                      className={`h-3 w-3 rounded-full shrink-0 shadow-sm ring-2 ring-white ${STATUT_DOT[rdv.statut]} ${past ? 'opacity-40' : ''}`}
                    />
                    {/* Time pill */}
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold tracking-tight shadow-sm ${
                        past ? 'bg-zinc-100 text-zinc-400' : STATUT_PILL[rdv.statut]
                      }`}
                    >
                      {rdv.heureRdv.slice(0, 5)}
                    </span>
                    {/* Duration tick */}
                    <span className="text-[10px] text-zinc-300 font-medium">{rdv.duree}min</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-1 flex items-center gap-3 flex-wrap">
            {(['CONFIRME', 'EN_ATTENTE', 'ANNULE'] as StatutRdv[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${STATUT_DOT[s]}`} />
                <span className="text-[10px] font-semibold text-zinc-400">{STATUT_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OccupationBar({ rdvs, disponibilites }: { rdvs: RendezVous[]; disponibilites: Disponibilite[] }) {
  const { monday, sunday } = getWeekRange()
  const totalSlots = computeTotalWeekSlots(disponibilites)
  const bookedCount = rdvs.filter(
    (r) => r.dateRdv >= monday && r.dateRdv <= sunday && r.statut !== 'ANNULE'
  ).length
  const taux = totalSlots > 0 ? Math.min(Math.round((bookedCount / totalSlots) * 100), 100) : 0
  const barColor = taux >= 80 ? 'bg-red-400' : taux >= 50 ? 'bg-amber-400' : 'bg-[#2EB67D]'

  return (
    <div className="rounded-2xl bg-white border border-zinc-100 px-5 py-5 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E2F0FD]">
          <TrendingUp className="h-5 w-5 text-[#1863A9]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-[#010C2D]">Occupation de la semaine</p>
          <p className="text-xs font-medium text-zinc-400 mt-0.5">{bookedCount} sur {totalSlots || '—'} créneaux réservés</p>
        </div>
        <span className="text-2xl font-bold text-[#010C2D]">{taux}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${taux}%` }}
        />
      </div>
    </div>
  )
}

const DASH_MIN_LEFT = 360
const DASH_MAX_LEFT = 900
const DASH_DEFAULT_LEFT = 680

export default function MedecinDashboardPage() {
  useRoleGuard('MEDECIN')

  const [medecinId, setMedecinId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [leftWidth, setLeftWidth] = useState(DASH_DEFAULT_LEFT)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef(false)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const newWidth = Math.max(DASH_MIN_LEFT, Math.min(DASH_MAX_LEFT, e.clientX - rect.left))
    setLeftWidth(newWidth)
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

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [handleMouseMove, handleMouseUp])

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'MEDECIN' && session.id) {
      setMedecinId(session.id)
      setFirstName(session.firstName ?? '')
    }
  }, [])

  const { data: rdvs } = useRdvsMedecin(medecinId)
  const { data: disponibilites } = useDisponibilites(medecinId)

  const today = todayISO()
  const allRdvs = rdvs ?? []
  const allDispos = disponibilites ?? []

  const todayRdvs = allRdvs.filter((r) => r.dateRdv === today)
  const confirmes = todayRdvs.filter((r) => r.statut === 'CONFIRME').length
  const enAttente = todayRdvs.filter((r) => r.statut === 'EN_ATTENTE').length
  const annules = todayRdvs.filter((r) => r.statut === 'ANNULE').length

  const upcomingRdvs = [...allRdvs]
    .filter((r) => r.dateRdv >= today && r.statut !== 'ANNULE')
    .sort((a, b) => a.dateRdv.localeCompare(b.dateRdv) || a.heureRdv.localeCompare(b.heureRdv))
    .slice(0, 5)

  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())

  return (
    <main className="px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#010C2D]">
          Bonjour{firstName ? `, Dr. ${firstName}` : ''} 👋
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500 capitalize">{dateLabel}</p>
      </div>

      {!medecinId ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white py-20 text-center">
          <p className="text-sm text-zinc-400">Chargement…</p>
        </div>
      ) : (
        <div ref={containerRef} className="flex items-start gap-0">
          {/* Left column */}
          <div className="shrink-0 space-y-5 min-w-0" style={{ width: leftWidth }}>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                active
                label="RDVs du jour"
                value={todayRdvs.length}
                sub="Tous statuts"
                iconBg="bg-[#DFEFFE]"
                icon={<CalendarDays className="h-5 w-5 text-[#1863A9]" />}
              />
              <StatCard
                label="Confirmés"
                value={confirmes}
                sub="Aujourd'hui"
                iconBg="bg-emerald-50"
                icon={<CheckCircle2 className="h-5 w-5 text-[#2EB67D]" />}
              />
              <StatCard
                label="En attente"
                value={enAttente}
                sub="Aujourd'hui"
                iconBg="bg-amber-50"
                icon={<Clock4 className="h-5 w-5 text-[#ECB22E]" />}
              />
              <StatCard
                label="Annulés"
                value={annules}
                sub="Aujourd'hui"
                iconBg="bg-red-50"
                icon={<XCircle className="h-5 w-5 text-[#E01E5A]" />}
              />
            </div>

            {/* Upcoming RDV table */}
            <div className="rounded-2xl bg-white border border-zinc-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#010C2D]">Prochains rendez-vous</p>
                <span className="text-xs text-zinc-400">{upcomingRdvs.length} à venir</span>
              </div>
              {upcomingRdvs.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-zinc-400">Aucun rendez-vous à venir</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {upcomingRdvs.map((rdv) => {
                    const name = patientName(rdv)
                    const initials = patientInitials(rdv)
                    const hue = avatarHue(rdv.patientId)
                    const isToday = rdv.dateRdv === today
                    const dateStr = isToday
                      ? "Aujourd'hui"
                      : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(
                          new Date(rdv.dateRdv + 'T00:00:00')
                        )
                    const motif = rdv.questionnaire?.motif ?? rdv.motif

                    return (
                      <div key={rdv.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50/50 transition-colors">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                          style={{ background: `hsl(${hue} 65% 55%)` }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#010C2D] truncate">{name}</p>
                          <p className="text-xs font-medium text-zinc-500 mt-0.5 truncate">{motif || 'Consultation'}</p>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-[#010C2D]">{rdv.heureRdv}</p>
                            <p className="text-xs font-medium text-zinc-400 mt-0.5">{dateStr}</p>
                          </div>
                          
                          <span className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${STATUT_BADGE[rdv.statut]}`}>
                            {STATUT_LABELS[rdv.statut]}
                          </span>
                          
                          <div className="flex items-center gap-1 pl-2 border-l border-zinc-100">
                            <button className="p-1.5 text-zinc-400 hover:text-[#1863A9] hover:bg-[#E2F0FD] rounded-lg transition-colors">
                              <PenLine className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Occupation bar */}
            <OccupationBar rdvs={allRdvs} disponibilites={allDispos} />
          </div>

          {/* DIVIDER */}
          <div
            onMouseDown={handleDividerMouseDown}
            className={`group relative mx-3 flex w-1 self-stretch shrink-0 cursor-col-resize select-none items-center justify-center rounded-full transition-colors ${
              isDragging ? 'bg-[#1863A9]' : 'bg-zinc-100 hover:bg-[#1863A9]/40'
            }`}
          >
            <div className={`absolute z-10 flex flex-col gap-1 rounded-full bg-white px-1 py-2 shadow-sm ring-1 ring-zinc-100 transition-opacity ${
              isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="block h-1 w-1 rounded-full bg-[#1863A9]" />
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="flex-1 min-w-[260px] space-y-5">
            <TodayTimeline rdvs={todayRdvs} />
          </div>
        </div>
      )}
    </main>
  )
}
