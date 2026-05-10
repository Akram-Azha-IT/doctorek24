'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useRdvsMedecin, useDisponibilites } from '@/features/agenda/hooks'
import type { Disponibilite, RendezVous, StatutRdv } from '@/lib/types'
import { getSession } from '@/lib/session'
import { useRoleGuard } from '@/lib/useRoleGuard'
import {
  CalendarDays, CheckCircle2, Clock4, XCircle, TrendingUp,
  ArrowRight, ChevronRight, BarChart2, X,
} from 'lucide-react'

const STATUT_LABELS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME:   'Confirmé',
  ANNULE:     'Annulé',
  TERMINE:    'Terminé',
}

const STATUT_BADGE: Record<StatutRdv, { bg: string; color: string }> = {
  EN_ATTENTE: { bg: '#FFF8E6', color: '#E59E00' },
  CONFIRME:   { bg: '#E6F8F0', color: '#009E60' },
  ANNULE:     { bg: '#FFEBEB', color: '#E01E5A' },
  TERMINE:    { bg: '#F4F4F5', color: '#71717A' },
}

const STATUT_DOT: Record<StatutRdv, string> = {
  CONFIRME:   '#2EB67D',
  EN_ATTENTE: '#ECB22E',
  ANNULE:     '#E01E5A',
  TERMINE:    '#A0AEC0',
}

function todayISO(): string { return localDateISO(new Date()) }

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

function avatarHue(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360
  return h
}

/* ── Hero Banner ── */
function HeroBanner({
  firstName, lastName, todayCount, dateLabel, onAgenda,
}: {
  firstName: string
  lastName: string
  todayCount: number
  dateLabel: string
  onAgenda: () => void
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const initials = ((firstName.charAt(0) ?? '') + (lastName.charAt(0) ?? '')).toUpperCase() || 'DR'
  const fullName = [firstName, lastName].filter(Boolean).join(' ')

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-7 py-6"
      style={{
        background: 'linear-gradient(135deg, #0066DD 0%, #007DFF 45%, #3DA8FF 100%)',
        boxShadow: '0 8px 32px rgba(0,125,255,0.28)',
      }}
    >
      {/* Botanical leaf shapes — right side decoration */}
      <svg
        className="pointer-events-none absolute top-0 right-0 h-full"
        viewBox="0 0 320 140" preserveAspectRatio="xMaxYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.18 }}
      >
        {/* Large leaf — top right */}
        <path
          d="M320,0 C280,-10 210,30 195,80 C180,130 230,155 280,120 C330,85 350,20 320,0Z"
          fill="white"
        />
        {/* Medium leaf — mid right */}
        <path
          d="M320,50 C295,35 255,55 248,90 C241,125 275,140 305,122 C335,104 345,65 320,50Z"
          fill="white"
        />
        {/* Small leaf — bottom right */}
        <path
          d="M310,100 C292,92 270,105 268,125 C266,145 288,152 305,140 C322,128 328,108 310,100Z"
          fill="white"
        />
        {/* Thin stem lines */}
        <path d="M260,80 C275,60 295,45 320,40" fill="none" stroke="white" strokeWidth="1.2" opacity="0.5" />
        <path d="M268,125 C280,112 295,105 315,100" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
      </svg>

      <div className="relative z-10 flex items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {dateLabel}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-white leading-tight">
            {greeting}{firstName ? `, Dr. ${firstName}` : ''} !
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.78)' }}>
            {todayCount === 0
              ? "Aucun rendez-vous prévu aujourd'hui — profitez-en pour vous avancer."
              : `Vous avez ${todayCount} rendez-vous aujourd'hui. Bonne journée !`}
          </p>
          <button
            onClick={onAgenda}
            className="mt-4 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#FFFFFF', backdropFilter: 'blur(4px)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.28)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.18)' }}
          >
            Ouvrir l'agenda <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Doctor avatar */}
        <div className="hidden lg:flex flex-col items-center gap-3 shrink-0">
          <div className="relative">
            {/* Outer pulse ring */}
            <div
              className="absolute rounded-full animate-ping"
              style={{
                inset: -6,
                background: 'rgba(255,255,255,0.12)',
                animationDuration: '2.8s',
              }}
            />
            {/* Mid ring */}
            <div
              className="absolute rounded-full"
              style={{
                inset: -3,
                border: '2px solid rgba(255,255,255,0.25)',
              }}
            />
            {/* Avatar circle */}
            <div
              className="relative h-20 w-20 rounded-full flex items-center justify-center text-2xl font-black select-none"
              style={{
                background: 'rgba(255,255,255,0.20)',
                border: '3px solid rgba(255,255,255,0.55)',
                backdropFilter: 'blur(10px)',
                color: '#FFFFFF',
                letterSpacing: '0.05em',
              }}
            >
              {initials}
            </div>
            {/* MD badge */}
            <div
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-black"
              style={{
                background: '#2EB67D',
                border: '2.5px solid rgba(255,255,255,0.9)',
                color: '#FFFFFF',
                letterSpacing: '0.04em',
              }}
            >
              MD
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white leading-tight">
              {fullName ? `Dr. ${fullName}` : 'Docteur'}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Médecin
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Stat Card ── */
interface StatCardProps {
  label: string
  value: number
  sub: string
  icon: React.ReactNode
  iconColor: string
  iconBg: string
}

function StatCard({ label, value, sub, icon, iconColor, iconBg }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: '#FFFFFF', boxShadow: '0 1px 4px rgba(16,30,54,0.06)', border: '1px solid #EEF1F6' }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: iconBg }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold leading-none" style={{ color: '#010C2D' }}>{value}</p>
        <p className="mt-1 text-xs font-semibold" style={{ color: '#6B7A99' }}>{label}</p>
        <p className="mt-0.5 text-[11px]" style={{ color: '#A0AEC0' }}>{sub}</p>
      </div>
    </div>
  )
}

/* ── Weekly Activity Chart ── */
function WeeklyChart({ rdvs }: { rdvs: RendezVous[] }) {
  const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const counts = [0, 0, 0, 0, 0, 0, 0]

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffISO = localDateISO(cutoff)

  rdvs.forEach((rdv) => {
    if (rdv.dateRdv >= cutoffISO && rdv.statut !== 'ANNULE') {
      const d = new Date(rdv.dateRdv + 'T00:00:00')
      const dow = (d.getDay() + 6) % 7
      counts[dow]++
    }
  })

  const max = Math.max(...counts, 1)
  const todayDow = (new Date().getDay() + 6) % 7
  const total = counts.reduce((a, b) => a + b, 0)

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#FFFFFF', border: '1px solid #EEF1F6', boxShadow: '0 1px 4px rgba(16,30,54,0.06)' }}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-bold" style={{ color: '#010C2D' }}>Activité hebdomadaire</p>
          <p className="text-xs mt-0.5" style={{ color: '#A0AEC0' }}>30 derniers jours — {total} RDV</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: '#EBF4FF' }}>
          <BarChart2 className="h-4 w-4" style={{ color: '#007DFF' }} />
        </div>
      </div>

      <div className="flex items-end gap-2" style={{ height: 110 }}>
        {DAYS.map((day, i) => {
          const pct = (counts[i] / max) * 100
          const isToday = i === todayDow
          return (
            <div key={day} className="flex-1 flex flex-col items-center justify-end gap-1.5">
              <div className="w-full flex justify-center items-end" style={{ height: 96 }}>
                <div
                  className="w-full rounded-t-md transition-all duration-700"
                  style={{
                    height: `${Math.max(pct, 4)}%`,
                    background: isToday
                      ? 'linear-gradient(to top, #0055CC, #3DA8FF)'
                      : 'linear-gradient(to top, #C8DDFF, #D6EAFF)',
                    borderRadius: '4px 4px 0 0',
                    boxShadow: isToday ? '0 -2px 8px rgba(0,125,255,0.30)' : 'none',
                  }}
                />
              </div>
              <span
                className="text-[10px] font-bold"
                style={{ color: isToday ? '#007DFF' : '#C4CFDD' }}
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

/* ── Today Timeline ── */
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
  const parseMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
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
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #EEF1F6', boxShadow: '0 1px 4px rgba(16,30,54,0.06)' }}
    >
      <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b" style={{ borderColor: '#F0F2F5' }}>
        <div>
          <p className="text-sm font-bold" style={{ color: '#010C2D' }}>Programme du jour</p>
          <p className="text-xs mt-0.5" style={{ color: '#A0AEC0' }}>
            {active.length === 0 ? 'Journée libre' : `${active.length} rendez-vous`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{ background: '#EBF4FF' }}>
          <Clock4 className="h-3.5 w-3.5" style={{ color: '#007DFF' }} />
          <span className="text-xs font-bold" style={{ color: '#007DFF' }}>
            {String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:{String(nowMinutes % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="px-5 pb-5 pt-4">
          <div className="relative" style={{ height: 260 }}>
            {/* Ghost timeline 08:00–18:00 */}
            {[8,9,10,11,12,13,14,15,16,17,18].map((h) => {
              const pct = ((h * 60 - 8 * 60) / (10 * 60)) * 100
              return (
                <div key={h} className="absolute left-0 right-0 flex items-center gap-2" style={{ top: `${pct}%` }}>
                  <span className="text-[10px] font-semibold w-7 shrink-0 text-right leading-none" style={{ color: '#E0E6EF' }}>
                    {h}h
                  </span>
                  <div className="flex-1 h-px" style={{ background: '#F0F2F5' }} />
                </div>
              )
            })}
            {/* Centered overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: '#F5F7FA' }}>
                <CalendarDays className="h-6 w-6" style={{ color: '#C4CFDD' }} />
              </div>
              <p className="text-sm text-center" style={{ color: '#A0AEC0' }}>
                Aucun rendez-vous<br />aujourd'hui
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 pb-5 pt-4">
          <div className="relative" style={{ height: 260 }}>
            {hourMarks.map((h) => {
              const pct = toPercent(h * 60)
              return (
                <div key={h} className="absolute left-0 right-0 flex items-center gap-2" style={{ top: `${pct}%` }}>
                  <span className="text-[10px] font-semibold w-7 shrink-0 text-right leading-none" style={{ color: '#C4CFDD' }}>
                    {h}h
                  </span>
                  <div className="flex-1 h-px" style={{ background: '#F0F2F5' }} />
                </div>
              )
            })}

            {nowVisible && (
              <div className="absolute left-0 right-0 z-20 flex items-center gap-2 pointer-events-none" style={{ top: `${nowPct}%` }}>
                <span className="w-7 shrink-0" />
                <div className="flex-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0 animate-pulse" style={{ background: '#E01E5A', boxShadow: '0 0 0 3px rgba(224,30,90,0.2)' }} />
                  <div className="flex-1 h-px" style={{ background: '#E01E5A', opacity: 0.4 }} />
                </div>
              </div>
            )}

            {active.map((rdv) => {
              const min = parseMin(rdv.heureRdv)
              const pct = toPercent(min)
              const past = min < nowMinutes
              const badge = STATUT_BADGE[rdv.statut]
              return (
                <div
                  key={rdv.id}
                  className="absolute left-0 right-0 z-10 flex items-center gap-2"
                  style={{ top: `${pct}%`, transform: 'translateY(-50%)' }}
                >
                  <span className="w-7 shrink-0" />
                  <div className="flex-1 flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full shrink-0 ring-2 ring-white"
                      style={{ background: past ? '#C4CFDD' : STATUT_DOT[rdv.statut], opacity: past ? 0.5 : 1 }}
                    />
                    <span
                      className="rounded-lg px-2.5 py-1 text-xs font-bold"
                      style={past ? { background: '#F5F7FA', color: '#A0AEC0' } : { background: badge.bg, color: badge.color }}
                    >
                      {rdv.heureRdv.slice(0, 5)}
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: '#C4CFDD' }}>{rdv.duree}min</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-2 flex items-center gap-4 flex-wrap">
            {(['CONFIRME', 'EN_ATTENTE', 'ANNULE'] as StatutRdv[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: STATUT_DOT[s] }} />
                <span className="text-[10px] font-semibold" style={{ color: '#A0AEC0' }}>{STATUT_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Occupation Bar ── */
function OccupationBar({ rdvs, disponibilites }: { rdvs: RendezVous[]; disponibilites: Disponibilite[] }) {
  const { monday, sunday } = getWeekRange()
  const totalSlots = computeTotalWeekSlots(disponibilites)
  const bookedCount = rdvs.filter(
    (r) => r.dateRdv >= monday && r.dateRdv <= sunday && r.statut !== 'ANNULE'
  ).length
  const taux = totalSlots > 0 ? Math.min(Math.round((bookedCount / totalSlots) * 100), 100) : 0
  const barColor = taux >= 80 ? '#E01E5A' : taux >= 50 ? '#ECB22E' : '#2EB67D'
  const barBg = taux >= 80 ? '#FFEBEB' : taux >= 50 ? '#FFF8E6' : '#E6F8F0'

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#FFFFFF', border: '1px solid #EEF1F6', boxShadow: '0 1px 4px rgba(16,30,54,0.06)' }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#EBF4FF' }}>
          <TrendingUp className="h-5 w-5" style={{ color: '#007DFF' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ color: '#010C2D' }}>Taux d'occupation</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#A0AEC0' }}>
            {bookedCount} / {totalSlots || '—'} créneaux — semaine en cours
          </p>
        </div>
        <span
          className="text-lg font-extrabold px-3 py-1 rounded-xl"
          style={{ color: barColor, background: barBg }}
        >
          {taux}%
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: '#F0F2F5' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${taux}%`,
            background: taux >= 80
              ? 'linear-gradient(to right, #C0063E, #E01E5A)'
              : taux >= 50
              ? 'linear-gradient(to right, #C8860A, #ECB22E)'
              : 'linear-gradient(to right, #1A9055, #2EB67D)',
            boxShadow: `0 0 8px ${barColor}55`,
          }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[10px]" style={{ color: '#C4CFDD' }}>0%</span>
        <span className="text-[10px]" style={{ color: '#C4CFDD' }}>100%</span>
      </div>
      <div className="mt-3 flex items-center justify-between pt-3" style={{ borderTop: '1px solid #F0F2F5' }}>
        <div>
          <p className="text-[11px]" style={{ color: '#A0AEC0' }}>Créneaux utilisés</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: barColor }}>{bookedCount}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px]" style={{ color: '#A0AEC0' }}>Créneaux disponibles</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: '#2EB67D' }}>{Math.max(0, totalSlots - bookedCount)}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Quick Actions ── */
function QuickActions({ router }: { router: ReturnType<typeof useRouter> }) {
  const actions = [
    { label: 'Agenda', sub: 'Gérer mes RDV', href: '/dashboard/medecin/agenda', bg: '#EBF4FF', color: '#007DFF', icon: <CalendarDays className="h-5 w-5" /> },
    { label: 'Disponibilités', sub: 'Mes créneaux', href: '/dashboard/medecin/disponibilites', bg: '#E6F8F0', color: '#2EB67D', icon: <Clock4 className="h-5 w-5" /> },
    { label: 'Profil', sub: 'Mes informations', href: '/dashboard/medecin/profil', bg: '#FFF8E6', color: '#ECB22E', icon: <CheckCircle2 className="h-5 w-5" /> },
  ]

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: '#FFFFFF', border: '1px solid #EEF1F6', boxShadow: '0 1px 4px rgba(16,30,54,0.06)' }}
    >
      <p className="text-sm font-bold mb-4" style={{ color: '#010C2D' }}>Accès rapide</p>
      <div className="flex flex-col gap-2">
        {actions.map((a) => (
          <button
            key={a.href}
            type="button"
            onClick={() => router.push(a.href)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-left w-full"
            style={{ border: '1px solid #EEF1F6' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F9FF' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: a.bg }}>
              <span style={{ color: a.color }}>{a.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: '#010C2D' }}>{a.label}</p>
              <p className="text-[11px]" style={{ color: '#A0AEC0' }}>{a.sub}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0" style={{ color: '#C4CFDD' }} />
          </button>
        ))}
      </div>
    </div>
  )
}

const DASH_MIN_LEFT = 340
const DASH_MAX_LEFT = 860
const DASH_DEFAULT_LEFT = 660

/* ── Main Page ── */
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
      setLastName(session.lastName ?? '')
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
  const annules   = todayRdvs.filter((r) => r.statut === 'ANNULE').length

  const upcomingRdvs = [...allRdvs]
    .filter((r) => r.dateRdv >= today && r.statut !== 'ANNULE')
    .sort((a, b) => a.dateRdv.localeCompare(b.dateRdv) || a.heureRdv.localeCompare(b.heureRdv))
    .slice(0, 6)

  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Hero banner */}
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
          {/* Stat cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="RDVs du jour"
              value={todayRdvs.length}
              sub="Tous statuts"
              iconColor="#007DFF"
              iconBg="#EBF4FF"
              icon={<CalendarDays className="h-5 w-5" />}
            />
            <StatCard
              label="Confirmés"
              value={confirmes}
              sub="Aujourd'hui"
              iconColor="#2EB67D"
              iconBg="#E6F8F0"
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <StatCard
              label="En attente"
              value={enAttente}
              sub="Aujourd'hui"
              iconColor="#ECB22E"
              iconBg="#FFF8E6"
              icon={<Clock4 className="h-5 w-5" />}
            />
            <StatCard
              label="Annulés"
              value={annules}
              sub="Aujourd'hui"
              iconColor="#E01E5A"
              iconBg="#FFEBEB"
              icon={<XCircle className="h-5 w-5" />}
            />
          </div>

          {/* Conseil du jour */}
          {showConseil && (
            <div
              className="rounded-2xl px-6 py-4 flex items-center gap-4 relative"
              style={{ background: '#EBF4FF', border: '1px solid #DFEFFE' }}
            >
              {/* Doctor illustration placeholder */}
              <div
                className="shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-xl"
                style={{ background: '#DFEFFE' }}
              >
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

          {/* Main split area */}
          <div ref={containerRef} className="flex items-start gap-0">
            {/* Left column */}
            <div className="shrink-0 space-y-4 min-w-0" style={{ width: leftWidth }}>
              {/* Upcoming appointments */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: '#FFFFFF', border: '1px solid #EEF1F6', boxShadow: '0 1px 4px rgba(16,30,54,0.06)' }}
              >
                <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: '#F0F2F5' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#010C2D' }}>Prochains rendez-vous</p>
                    <p className="text-xs mt-0.5" style={{ color: '#A0AEC0' }}>À venir — non annulés</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{ background: '#EBF4FF', color: '#007DFF' }}
                    >
                      {upcomingRdvs.length}
                    </span>
                    <button
                      className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: '#007DFF' }}
                      onClick={() => router.push('/dashboard/medecin/agenda')}
                    >
                      Voir tout <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {upcomingRdvs.length === 0 ? (
                  <div className="py-14 flex flex-col items-center gap-4">
                    <div
                      className="h-16 w-16 rounded-2xl flex items-center justify-center relative"
                      style={{ background: 'linear-gradient(135deg, #EBF4FF, #DFEFFE)' }}
                    >
                      <CalendarDays className="h-7 w-7" style={{ color: '#007DFF' }} />
                      <span
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: '#2EB67D', border: '2px solid white' }}
                      >0</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold" style={{ color: '#010C2D' }}>Agenda dégagé</p>
                      <p className="text-xs mt-1 max-w-[220px]" style={{ color: '#A0AEC0' }}>Profitez de ce moment pour mettre à jour vos dossiers patients.</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Table header */}
                    <div
                      className="grid px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: '#A0AEC0', background: '#FAFBFC', gridTemplateColumns: '1fr 120px 90px 100px' }}
                    >
                      <span>Patient</span>
                      <span>Motif</span>
                      <span>Date / Heure</span>
                      <span className="text-right">Statut</span>
                    </div>

                    {upcomingRdvs.map((rdv, idx) => {
                      const name     = patientName(rdv)
                      const initials = patientInitials(rdv)
                      const hue      = avatarHue(rdv.patientId)
                      const isToday  = rdv.dateRdv === today
                      const dateStr  = isToday
                        ? "Aujourd'hui"
                        : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(
                            new Date(rdv.dateRdv + 'T00:00:00')
                          )
                      const motif = rdv.questionnaire?.motif ?? rdv.motif
                      const badge = STATUT_BADGE[rdv.statut]

                      return (
                        <div
                          key={rdv.id}
                          className="grid items-center px-5 py-3.5 border-t transition-colors"
                          style={{
                            borderColor: '#F0F2F5',
                            gridTemplateColumns: '1fr 120px 90px 100px',
                            background: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#F5F9FF' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC' }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                              style={{ background: `hsl(${hue} 60% 55%)` }}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: '#010C2D' }}>{name}</p>
                              <p className="text-xs truncate" style={{ color: '#A0AEC0' }}>{rdv.duree} min</p>
                            </div>
                          </div>

                          <p className="text-xs truncate" style={{ color: '#6B7A99' }}>
                            {motif || 'Consultation'}
                          </p>

                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#010C2D' }}>{rdv.heureRdv.slice(0, 5)}</p>
                            <p className="text-[11px]" style={{ color: '#A0AEC0' }}>{dateStr}</p>
                          </div>

                          <div className="flex justify-end">
                            <span
                              className="rounded-lg px-2.5 py-1 text-[11px] font-bold"
                              style={{ background: badge.bg, color: badge.color }}
                            >
                              {STATUT_LABELS[rdv.statut]}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Bottom row: occupation + weekly chart */}
              <div className="grid grid-cols-2 gap-4">
                <OccupationBar rdvs={allRdvs} disponibilites={allDispos} />
                <WeeklyChart rdvs={allRdvs} />
              </div>
            </div>

            {/* Split divider */}
            <div
              onMouseDown={handleDividerMouseDown}
              className="group relative mx-3 flex w-1 self-stretch shrink-0 cursor-col-resize select-none items-center justify-center rounded-full transition-colors"
              style={{ background: isDragging ? '#007DFF' : '#E5E9F0' }}
              onMouseEnter={(e) => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = '#B6DAF7' }}
              onMouseLeave={(e) => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = '#E5E9F0' }}
            >
              <div
                className={`absolute z-10 flex flex-col gap-1 rounded-full bg-white px-1 py-2 shadow-sm ring-1 ring-[#E5E9F0] transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                {[0, 1, 2].map((i) => (
                  <span key={i} className="block h-1 w-1 rounded-full" style={{ background: '#007DFF' }} />
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="flex-1 min-w-[240px] space-y-4">
              <TodayTimeline rdvs={todayRdvs} />
              <QuickActions router={router} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
