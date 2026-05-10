'use client'

import { useState } from 'react'
import { CreditCard, ChevronLeft, ChevronRight, Heart, MapPin, User } from 'lucide-react'
import { useAdminCartes } from '@/features/admin/hooks'
import type { CarteSummary } from '@/features/admin/types'

const STATUT_STYLES: Record<string, string> = {
  VIRTUEL: 'bg-[#E8F2FC] text-[#007DFF]',
  PHYSIQUE: 'bg-emerald-50 text-emerald-700',
  SUSPENDU: 'bg-rose-50 text-rose-600',
}

function GroupeSanguinBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-zinc-400">—</span>
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600">
      <Heart className="h-3 w-3" />
      {value}
    </span>
  )
}

function StatutBadge({ statut }: { statut: string }) {
  const cls = STATUT_STYLES[statut] ?? 'bg-zinc-100 text-zinc-500'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {statut}
    </span>
  )
}

function CarteRow({ carte }: { carte: CarteSummary }) {
  const createdAt = carte.createdAt
    ? new Date(carte.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'

  return (
    <tr className="border-b border-zinc-50 hover:bg-[#F8F9FB] transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E8F2FC]">
            <CreditCard className="h-4 w-4 text-[#007DFF]" />
          </div>
          <span className="font-mono text-sm font-semibold text-[#010C2D]">{carte.cardRef}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-zinc-400" />
          <span className="font-mono text-xs text-zinc-500 truncate max-w-[200px]">{carte.patientId}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <StatutBadge statut={carte.statut} />
      </td>
      <td className="px-6 py-4">
        <GroupeSanguinBadge value={carte.groupeSanguin} />
      </td>
      <td className="px-6 py-4">
        {carte.adresseVille ? (
          <div className="flex items-center gap-1.5 text-sm text-zinc-600">
            <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            {carte.adresseVille}
            {carte.adressePays ? `, ${carte.adressePays}` : ''}
          </div>
        ) : (
          <span className="text-zinc-400 text-sm">—</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-zinc-500">{createdAt}</span>
      </td>
    </tr>
  )
}

export default function AdminCartesPage() {
  const [page, setPage] = useState(0)
  const size = 20
  const { data, isLoading, error } = useAdminCartes(page, size)

  const totalPages = data ? Math.ceil(data.total / size) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#010C2D]">Cartes virtuelles</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {data ? `${data.total.toLocaleString('fr-FR')} carte${data.total !== 1 ? 's' : ''} enregistrée${data.total !== 1 ? 's' : ''}` : 'Chargement…'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-zinc-100 overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-sm text-red-500">Erreur lors du chargement des cartes.</p>
          </div>
        ) : (
          <>
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-[#F8F9FB]">
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Réf. carte</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Patient ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Groupe sanguin</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Localisation</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Créée le</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-zinc-50">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-6 py-4">
                            <div className="h-4 rounded bg-zinc-100 animate-pulse" style={{ width: `${60 + (i * j) % 40}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : data?.cartes.length === 0
                  ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <CreditCard className="mx-auto h-10 w-10 text-zinc-200 mb-3" />
                          <p className="text-sm text-zinc-400 font-medium">Aucune carte virtuelle enregistrée.</p>
                        </td>
                      </tr>
                    )
                  : data?.cartes.map((carte) => <CarteRow key={carte.id} carte={carte} />)
                }
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4">
                <p className="text-sm text-zinc-500">
                  Page {page + 1} sur {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:border-[#007DFF] hover:text-[#007DFF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:border-[#007DFF] hover:text-[#007DFF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
