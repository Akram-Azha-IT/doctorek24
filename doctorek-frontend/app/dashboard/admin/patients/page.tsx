'use client'

import { useState, useRef, Fragment } from 'react'
import { Search, CheckCircle, XCircle, ToggleLeft, ToggleRight, CreditCard, ChevronUp, ChevronDown } from 'lucide-react'
import { useAdminUsers, useToggleUserActive, usePatientCarte } from '@/features/admin/hooks'
import type { UserSummary } from '@/features/admin/types'
import { CarteRecto, CarteVerso } from '@/features/carte/components/CarteVirtuelleCard'
import { ConfirmToggleModal } from '@/features/admin/components/ConfirmToggleModal'

const PAGE_SIZE = 20

function PatientCartePanel({ patientId, firstName, lastName }: { patientId: string; firstName: string; lastName: string }) {
  const { data, isLoading, error } = usePatientCarte(patientId, true)
  const [flipped, setFlipped] = useState(false)

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-80 h-48 rounded-2xl bg-zinc-100 animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex justify-center py-6">
        <p className="text-sm text-zinc-400">Impossible de charger la carte.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center py-6 gap-3">
      <div
        style={{ width: 380, aspectRatio: '1.586', position: 'relative', perspective: '1400px', cursor: 'pointer', filter: 'drop-shadow(0 12px 28px rgba(0,125,255,0.18))' }}
        onClick={() => setFlipped(f => !f)}
        title="Cliquer pour retourner la carte"
      >
        <div style={{
          position: 'absolute', inset: 0,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          <CarteRecto carte={data} firstName={firstName} lastName={lastName} />
          <CarteVerso carte={data} firstName={firstName} lastName={lastName} />
        </div>
      </div>
      <p className="text-xs text-zinc-400 font-medium tracking-wider select-none">
        {flipped ? '← RECTO' : 'VERSO →'} · Cliquez sur la carte pour la retourner
      </p>
    </div>
  )
}

export default function AdminPatientsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingToggle, setPendingToggle] = useState<UserSummary | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading, error } = useAdminUsers('PATIENT', debouncedSearch, page, PAGE_SIZE)
  const toggle = useToggleUserActive()

  function handleSearch(value: string) {
    setSearch(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 300)
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => (prev === id ? null : id))
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-600" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#010C2D]">Patients</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Gestion des comptes patients — activation, cartes virtuelles.</p>
        </div>
        {data && (
          <span className="ml-auto inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
            {data.total} patient{data.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl bg-white border border-zinc-200 px-4 py-2.5 focus-within:ring-2 focus-within:ring-emerald-400/20 max-w-sm">
        <Search className="h-4 w-4 text-zinc-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Nom, email..."
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
                  <th className="py-3 px-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Carte</th>
                  <th className="py-3 px-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Statut</th>
                  <th className="py-3 px-5 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {!data?.users.length ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-zinc-400">Aucun patient trouvé.</td>
                  </tr>
                ) : (
                  data.users.map((user: UserSummary) => (
                    <Fragment key={user.id}>
                      <tr
                        className={`transition-colors ${
                          user.hasCarteVirtuelle ? 'cursor-pointer hover:bg-emerald-50/40' : 'hover:bg-zinc-50'
                        } ${expandedId === user.id ? 'bg-emerald-50/40' : ''}`}
                        onClick={() => { if (user.hasCarteVirtuelle) toggleExpand(user.id) }}
                      >
                        <td className="py-3.5 px-5">
                          <p className="font-semibold text-[#010C2D]">{user.firstName} {user.lastName}</p>
                        </td>
                        <td className="py-3.5 px-5 text-zinc-500">{user.email}</td>
                        <td className="py-3.5 px-5">
                          {user.hasCarteVirtuelle ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F2FC] px-2.5 py-0.5 text-xs font-semibold text-[#007DFF]">
                              <CreditCard className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400 font-medium">—</span>
                          )}
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
                          <div className="flex items-center justify-end gap-2">
                            {user.hasCarteVirtuelle && (
                              expandedId === user.id
                                ? <ChevronUp className="h-4 w-4 text-[#007DFF]" />
                                : <ChevronDown className="h-4 w-4 text-zinc-400" />
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPendingToggle(user) }}
                              disabled={toggle.isPending}
                              title={user.active ? 'Désactiver' : 'Activer'}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                                user.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {user.active ? <><ToggleRight className="h-4 w-4" /> Désactiver</> : <><ToggleLeft className="h-4 w-4" /> Activer</>}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === user.id && (
                        <tr key={`${user.id}-carte`} className="bg-emerald-50/30">
                          <td colSpan={5} className="px-8 pb-6 pt-0 border-b border-emerald-100">
                            <div className="border-t border-emerald-100 pt-1">
                              <PatientCartePanel patientId={user.id} firstName={user.firstName} lastName={user.lastName} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
