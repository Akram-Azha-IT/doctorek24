'use client'

import { Users, UserCheck, Calendar, CalendarCheck, Clock, CreditCard } from 'lucide-react'
import { useAdminStats } from '@/features/admin/hooks'

interface StatCardProps {
  label: string
  value: number | undefined
  icon: React.ElementType
  iconColor: string
  iconBg: string
}

function StatCard({ label, value, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-zinc-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-zinc-500">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-[#010C2D]">
        {value !== undefined ? value.toLocaleString('fr-FR') : '-'}
      </p>
    </div>
  )
}

type StatCardDef = Omit<StatCardProps, 'value'> & {
  key: keyof import('@/features/admin/types').AdminStats
}

const STAT_CARDS: StatCardDef[] = [
  { key: 'totalPatients', label: 'Patients', icon: Users, iconColor: 'text-[#007DFF]', iconBg: 'bg-[#E8F2FC]' },
  { key: 'totalMedecins', label: 'Médecins', icon: UserCheck, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  { key: 'totalRdvs', label: 'Total RDV', icon: Calendar, iconColor: 'text-purple-600', iconBg: 'bg-purple-50' },
  { key: 'rdvsAujourdhui', label: "RDV aujourd'hui", icon: CalendarCheck, iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
  { key: 'rdvsEnAttente', label: 'RDV en attente', icon: Clock, iconColor: 'text-rose-600', iconBg: 'bg-rose-50' },
  { key: 'totalCartes', label: 'Cartes virtuelles', icon: CreditCard, iconColor: 'text-teal-600', iconBg: 'bg-teal-50' },
]

export default function AdminOverviewPage() {
  const { data: stats, isLoading, error } = useAdminStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#010C2D]">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Aperçu global de la plateforme Doctorek.
        </p>
      </div>

      {error ? (
        <div className="flex items-center justify-center h-40 rounded-2xl bg-white border border-zinc-100">
          <p className="text-sm text-red-500">Erreur lors du chargement des statistiques.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-zinc-100 animate-pulse" />
              ))
            : STAT_CARDS.map((card) => (
                <StatCard
                  key={card.key}
                  label={card.label}
                  value={stats?.[card.key]}
                  icon={card.icon}
                  iconColor={card.iconColor}
                  iconBg={card.iconBg}
                />
              ))}
        </div>
      )}
    </div>
  )
}
