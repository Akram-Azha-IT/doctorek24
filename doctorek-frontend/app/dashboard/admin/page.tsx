'use client'

import { useRouter } from 'next/navigation'
import { Users, Stethoscope, Calendar, CalendarClock, Clock, CreditCard, ArrowRight } from 'lucide-react'
import { useAdminStats } from '@/features/admin/hooks'
import type { AdminStats } from '@/features/admin/types'

interface StatCardDef {
  key: keyof AdminStats
  label: string
  icon: React.ElementType
  accent: string
  iconBg: string
}

const PRIMARY_CARDS: StatCardDef[] = [
  { key: 'totalPatients', label: 'Patients inscrits', icon: Users, accent: 'text-[#007DFF]', iconBg: 'bg-[#E8F2FC]' },
  { key: 'totalMedecins', label: 'Médecins inscrits', icon: Stethoscope, accent: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  { key: 'totalCartes', label: 'Cartes virtuelles', icon: CreditCard, accent: 'text-violet-600', iconBg: 'bg-violet-50' },
]

const RDV_CARDS: StatCardDef[] = [
  { key: 'totalRdvs', label: 'Rendez-vous au total', icon: Calendar, accent: 'text-indigo-600', iconBg: 'bg-indigo-50' },
  { key: 'rdvsAujourdhui', label: "Rendez-vous aujourd'hui", icon: CalendarClock, accent: 'text-amber-600', iconBg: 'bg-amber-50' },
  { key: 'rdvsEnAttente', label: 'En attente de confirmation', icon: Clock, accent: 'text-rose-600', iconBg: 'bg-rose-50' },
]

function StatCard({ def, value }: { def: StatCardDef; value: number | undefined }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${def.iconBg}`}>
          <def.icon className={`h-5 w-5 ${def.accent}`} />
        </span>
      </div>
      <p className="text-[28px] font-extrabold leading-none tabular-nums text-[#010C2D]">
        {value !== undefined ? value.toLocaleString('fr-FR') : '—'}
      </p>
      <p className="mt-1.5 text-sm font-medium text-zinc-500">{def.label}</p>
    </div>
  )
}

function SkeletonCard() {
  return <div className="h-[132px] animate-pulse rounded-2xl bg-zinc-100" />
}

export default function AdminOverviewPage() {
  const router = useRouter()
  const { data: stats, isLoading, error } = useAdminStats()

  const totalUsers = (stats?.totalPatients ?? 0) + (stats?.totalMedecins ?? 0)
  const patientPct = totalUsers > 0 ? Math.round(((stats?.totalPatients ?? 0) / totalUsers) * 100) : 0
  const medecinPct = 100 - patientPct
  const carteCoverage =
    stats && stats.totalPatients > 0 ? Math.round((stats.totalCartes / stats.totalPatients) * 100) : 0

  if (error) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-zinc-100 bg-white">
        <p className="text-sm text-red-500">Erreur lors du chargement des statistiques.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#010C2D]">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Suivi en temps réel de la plateforme nationale Doctorek.
        </p>
      </div>

      {/* Comptes & cartes */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Comptes &amp; cartes</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : PRIMARY_CARDS.map((def) => <StatCard key={def.key} def={def} value={stats?.[def.key]} />)}
        </div>
      </section>

      {/* Activité rendez-vous */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Activité rendez-vous</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : RDV_CARDS.map((def) => <StatCard key={def.key} def={def} value={stats?.[def.key]} />)}
        </div>
      </section>

      {/* Répartition + accès rapide */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold text-[#010C2D]">Répartition des utilisateurs</h3>
          <p className="mt-0.5 text-sm text-zinc-500">Patients et médecins actifs sur la plateforme.</p>

          {isLoading ? (
            <div className="mt-6 h-4 animate-pulse rounded-full bg-zinc-100" />
          ) : (
            <>
              <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-zinc-100">
                <div className="bg-[#007DFF]" style={{ width: `${patientPct}%` }} />
                <div className="bg-emerald-500" style={{ width: `${medecinPct}%` }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#007DFF]" />
                  <span className="text-sm text-zinc-600">
                    Patients <span className="font-bold text-[#010C2D]">{patientPct}%</span>
                    <span className="ml-1 text-zinc-400">({(stats?.totalPatients ?? 0).toLocaleString('fr-FR')})</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm text-zinc-600">
                    Médecins <span className="font-bold text-[#010C2D]">{medecinPct}%</span>
                    <span className="ml-1 text-zinc-400">({(stats?.totalMedecins ?? 0).toLocaleString('fr-FR')})</span>
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-zinc-100 pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-600">Taux de couverture carte virtuelle</p>
                  <p className="text-sm font-bold text-violet-600">{carteCoverage}%</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, carteCoverage)}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-zinc-400">
                  Part des patients disposant d&apos;une carte santé virtuelle.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#010C2D]">Accès rapide</h3>
          <p className="mt-0.5 text-sm text-zinc-500">Sections d&apos;administration.</p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/admin/utilisateurs')}
              className="group flex w-full items-center gap-3 rounded-xl border border-zinc-100 bg-[#F8F9FB] px-4 py-3 text-left transition-colors hover:border-[#007DFF]/30 hover:bg-[#E8F2FC]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F2FC]">
                <Users className="h-4 w-4 text-[#007DFF]" />
              </span>
              <span className="flex-1 text-sm font-semibold text-[#010C2D]">Gérer les utilisateurs</span>
              <ArrowRight className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-[#007DFF]" />
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/admin/cartes')}
              className="group flex w-full items-center gap-3 rounded-xl border border-zinc-100 bg-[#F8F9FB] px-4 py-3 text-left transition-colors hover:border-violet-300 hover:bg-violet-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                <CreditCard className="h-4 w-4 text-violet-600" />
              </span>
              <span className="flex-1 text-sm font-semibold text-[#010C2D]">Cartes virtuelles</span>
              <ArrowRight className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-violet-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
