'use client'

import { useState, useRef } from 'react'
import { Search, CheckCircle, XCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAdminUsers, useToggleUserActive } from '@/features/admin/hooks'
import type { UserSummary } from '@/features/admin/types'
import { ConfirmToggleModal } from '@/features/admin/components/ConfirmToggleModal'

const PAGE_SIZE = 20

export default function AdminMedecinsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pendingToggle, setPendingToggle] = useState<UserSummary | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading, error } = useAdminUsers('MEDECIN', debouncedSearch, page, PAGE_SIZE)
  const toggle = useToggleUserActive()

  function handleSearch(value: string) {
    setSearch(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 300)
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  function handleConfirmToggle() {
    if (!pendingToggle) return
    toggle.mutate(pendingToggle.id, { onSettled: () => setPendingToggle(null) })
  }

  return (
    <>
    <ConfirmToggleModal
      open={pendingToggle !== null}
      userName={`${pendingToggle?.firstName ?? ''} ${pendingToggle?.lastName ?? ''}`.trim()}
      isActive={pendingToggle?.active ?? false}
      isPending={toggle.isPending}
      onConfirm={handleConfirmToggle}
      onCancel={() => setPendingToggle(null)}
    />
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F2FC]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#007DFF]" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#010C2D]">Médecins</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Gestion des comptes médecins : activation, spécialités.</p>
        </div>
        {data && (
          <span className="ml-auto inline-flex items-center rounded-full bg-[#E8F2FC] px-3 py-1 text-sm font-bold text-[#007DFF]">
            {data.total} médecin{data.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl bg-white border border-zinc-200 px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#007DFF]/20 max-w-sm">
        <Search className="h-4 w-4 text-zinc-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Nom, email, spécialité..."
          className="flex-1 bg-transparent text-sm text-[#010C2D] placeholder:text-zinc-400 outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 bg-zinc-50 animate-pulse border-b border-zinc-100 last:border-0" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-red-500">Erreur lors du chargement.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-[#F8F9FB]">
                  <th className="py-3 px-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Nom</th>
                  <th className="py-3 px-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Spécialité</th>
                  <th className="py-3 px-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Ville</th>
                  <th className="py-3 px-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Statut</th>
                  <th className="py-3 px-5 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {!data?.content?.length ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-zinc-400">Aucun médecin trouvé.</td>
                  </tr>
                ) : (
                  data.content.map((user: UserSummary) => (
                    <tr key={user.id} className="transition-colors hover:bg-[#E8F2FC]/30">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-[#010C2D]">{user.firstName} {user.lastName}</p>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-500">{user.email}</td>
                      <td className="py-3.5 px-5">
                        {user.specialite ? (
                          <span className="inline-flex items-center rounded-full bg-[#E8F2FC] px-2.5 py-0.5 text-xs font-semibold text-[#007DFF]">
                            {user.specialite}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 font-medium">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-zinc-500 text-sm">
                        {user.ville ?? <span className="text-zinc-400">-</span>}
                      </td>
                      <td className="py-3.5 px-5">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle className="h-3.5 w-3.5" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                            <XCircle className="h-3.5 w-3.5" /> Désactivé
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => setPendingToggle(user)}
                          disabled={toggle.isPending}
                          title={user.active ? 'Désactiver' : 'Activer'}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            user.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-[#E8F2FC] text-[#007DFF] hover:bg-blue-100'
                          }`}
                        >
                          {user.active ? <><ToggleRight className="h-4 w-4" /> Désactiver</> : <><ToggleLeft className="h-4 w-4" /> Activer</>}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3">
                <button type="button" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 transition-colors">Précédent</button>
                <p className="text-sm text-zinc-500">Page <span className="font-semibold text-[#010C2D]">{page + 1}</span> sur {totalPages}</p>
                <button type="button" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 transition-colors">Suivant</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  )
}
