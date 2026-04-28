'use client'

import { useEffect, useState } from 'react'
import { useRdvsMedecin, useDisponibilites } from '@/features/agenda/hooks'
import type { Disponibilite, RendezVous, StatutRdv } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { CalendarDays, CheckCircle2, Clock4, XCircle, TrendingUp, PenLine, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

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

function MiniCalendar({ markedDates }: { markedDates: Set<string> }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const todayStr = localDateISO(today)

  const firstDay = new Date(year, month, 1).getDay()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(today)

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="rounded-2xl bg-white border border-zinc-100 px-5 py-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[#010C2D] capitalize">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-zinc-50 rounded text-zinc-400 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
          <button className="p-1 hover:bg-zinc-50 rounded text-zinc-400 transition-colors"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-2 text-center">
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d, i) => (
          <span key={i} className="text-[11px] font-semibold text-zinc-400 pb-2">{d}</span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={i} />
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = iso === todayStr
          const hasRdv = markedDates.has(iso)
          return (
            <div key={i} className="flex items-center justify-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isToday
                    ? 'bg-[#1863A9] text-white shadow-sm shadow-[#1863A9]/20'
                    : hasRdv
                    ? 'bg-[#E2F0FD] text-[#1863A9]'
                    : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {day}
              </span>
            </div>
          )
        })}
      </div>
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

export default function MedecinDashboardPage() {
  useRoleGuard('MEDECIN')

  const [medecinId, setMedecinId] = useState('')
  const [firstName, setFirstName] = useState('')

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

  const markedDates = new Set(allRdvs.filter((r) => r.statut !== 'ANNULE').map((r) => r.dateRdv))

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
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

          {/* Right column */}
          <div className="space-y-5">
            <MiniCalendar markedDates={markedDates} />
          </div>
        </div>
      )}
    </main>
  )
}
