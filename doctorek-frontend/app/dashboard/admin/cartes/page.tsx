'use client'

import { useState } from 'react'
import { CreditCard, Droplet } from 'lucide-react'
import { useAdminCartes } from '@/features/admin/hooks'
import type { CarteSummary } from '@/features/admin/types'
import { AdminPagination } from '@/features/admin/components/AdminPagination'

const PAGE_SIZE = 20

const STATUT_STYLES: Record<string, string> = {
  VIRTUEL: 'bg-[#E8F2FC] text-[#007DFF]',
  PHYSIQUE: 'bg-emerald-50 text-emerald-700',
  SUSPENDU: 'bg-rose-50 text-rose-600',
}

function StatutBadge({ statut }: { statut: string }) {
  const cls = STATUT_STYLES[statut] ?? 'bg-zinc-100 text-zinc-500'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {statut}
    </span>
  )
}

function GroupeSanguinBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-zinc-400">-</span>
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">
      <Droplet className="h-3 w-3" />
      {value}
    </span>
  )
}

function CarteRow({ carte }: { carte: CarteSummary }) {
  const createdAt = carte.createdAt
    ? new Date(carte.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-'

  return (
    <tr className="border-b border-zinc-50 transition-colors last:border-0 hover:bg-[#F8F9FB]">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F2FC]">
            <CreditCard className="h-4 w-4 text-[#007DFF]" />
          </span>
          <span className="font-mono text-sm font-semibold text-[#010C2D]">{carte.cardRef}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <StatutBadge statut={carte.statut} />
      </td>
      <td className="px-6 py-4">
        <GroupeSanguinBadge value={carte.groupeSanguin} />
      </td>
      <td className="px-6 py-4">
        {carte.donneurOrganes ? (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Donneur
          </span>
        ) : (
          <span className="text-sm text-zinc-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-zinc-500">{createdAt}</td>
    </tr>
  )
}

export default function AdminCartesPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading, error } = useAdminCartes(page, PAGE_SIZE)
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#010C2D]">Cartes virtuelles</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {data
            ? `${data.total.toLocaleString('fr-FR')} carte${data.total !== 1 ? 's' : ''} santé enregistrée${data.total !== 1 ? 's' : ''}.`
            : 'Registre national des cartes santé virtuelles.'}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {error ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-red-500">Erreur lors du chargement des cartes.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-zinc-100 bg-[#F8F9FB]">
                    <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Réf. carte</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Statut</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Groupe sanguin</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Don d&apos;organes</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Créée le</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-zinc-50">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 animate-pulse rounded bg-zinc-100" style={{ width: `${55 + ((i * j) % 40)}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : data?.content?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <CreditCard className="mx-auto mb-3 h-10 w-10 text-zinc-200" />
                        <p className="text-sm font-medium text-zinc-400">Aucune carte virtuelle enregistrée.</p>
                      </td>
                    </tr>
                  ) : (
                    data?.content?.map((carte) => <CarteRow key={carte.id} carte={carte} />)
                  )}
                </tbody>
              </table>
            </div>

            <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
