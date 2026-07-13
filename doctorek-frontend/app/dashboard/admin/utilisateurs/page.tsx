'use client'

import { useState, useRef, Fragment } from 'react'
import { Search, CheckCircle, XCircle, ToggleLeft, ToggleRight, CreditCard, ChevronUp, ChevronDown } from 'lucide-react'
import { useAdminUsers, useToggleUserActive, usePatientCarte } from '@/features/admin/hooks'
import type { UserSummary } from '@/features/admin/types'
import { CarteRecto, CarteVerso } from '@/features/carte/components/CarteVirtuelleCard'
import { ConfirmToggleModal } from '@/features/admin/components/ConfirmToggleModal'

type RoleFilter = '' | 'PATIENT' | 'MEDECIN'

const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: 'Tous', value: '' },
  { label: 'Patients', value: 'PATIENT' },
  { label: 'Médecins', value: 'MEDECIN' },
]

const PAGE_SIZE = 20

function RoleBadge({ role }: { role: string }) {
  if (role === 'MEDECIN')
    return (
      <span className="inline-flex items-center rounded-full bg-[#E8F2FC] px-2.5 py-0.5 text-xs font-semibold text-[#007DFF]">
        Médecin
      </span>
    )
  if (role === 'PATIENT')
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        Patient
      </span>
    )
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
      {role}
    </span>
  )
}

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

export default function AdminUtilisateursPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [pendingToggle, setPendingToggle] = useState<UserSummary | null>(null)
  const { data, isLoading, error } = useAdminUsers(roleFilter, debouncedSearch, page, PAGE_SIZE)
  const toggle = useToggleUserActive()

  function handleSearch(value: string) {
    setSearch(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(0)
    }, 300)
  }

  function handleRoleChange(r: RoleFilter) {
    setRoleFilter(r)
    setPage(0)
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
      <div>
        <h1 className="text-2xl font-extrabold text-[#010C2D]">Utilisateurs</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gestion des comptes : activation, rôles, recherche.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex rounded-xl bg-white border border-zinc-200 p-1 gap-1">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleRoleChange(tab.value)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                roleFilter === tab.value
                  ? 'bg-[#007DFF] text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-white border border-zinc-200 px-4 py-2 focus-within:ring-2 focus-within:ring-[#007DFF]/20 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Nom, email..."
            className="flex-1 bg-transparent text-sm text-[#010C2D] placeholder:text-zinc-400 outline-none"
          />
        </div>

        {data && (
          <p className="text-sm text-zinc-500 ml-auto">
            <span className="font-semibold text-[#010C2D]">{data.total}</span>{' '}
            utilisateur{data.total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="space-y-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-zinc-50 animate-pulse border-b border-zinc-100 last:border-0"
              />
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
                  <th className="py-3 px-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="py-3 px-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="py-3 px-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="py-3 px-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                    Spécialité / Ville
                  </th>
                  <th className="py-3 px-5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="py-3 px-5 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {!data?.content?.length ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-zinc-400">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  data.content.map((user: UserSummary) => (
                    <Fragment key={user.id}>
                      <tr
                        className={`transition-colors ${
                          user.role === 'PATIENT' && user.hasCarteVirtuelle
                            ? 'cursor-pointer hover:bg-[#F0F7FF]'
                            : 'hover:bg-zinc-50'
                        } ${expandedId === user.id ? 'bg-[#F0F7FF]' : ''}`}
                        onClick={() => {
                          if (user.role === 'PATIENT' && user.hasCarteVirtuelle) {
                            toggleExpand(user.id)
                          }
                        }}
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[#010C2D]">
                              {user.firstName} {user.lastName}
                            </p>
                            {user.role === 'PATIENT' && user.hasCarteVirtuelle && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F2FC] px-2 py-0.5 text-[10px] font-semibold text-[#007DFF]">
                                <CreditCard className="h-2.5 w-2.5" />
                                Carte
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-zinc-500">{user.email}</td>
                        <td className="py-3.5 px-5">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="py-3.5 px-5 hidden lg:table-cell text-zinc-500">
                          {user.specialite || user.ville
                            ? [user.specialite, user.ville].filter(Boolean).join(' · ')
                            : '-'}
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
                            {user.role === 'PATIENT' && user.hasCarteVirtuelle && (
                              <span className="text-zinc-300">
                                {expandedId === user.id
                                  ? <ChevronUp className="h-4 w-4 text-[#007DFF]" />
                                  : <ChevronDown className="h-4 w-4 text-zinc-400" />
                                }
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPendingToggle(user)
                              }}
                              disabled={toggle.isPending}
                              title={user.active ? 'Désactiver le compte' : 'Activer le compte'}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                                user.active
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {user.active ? (
                                <>
                                  <ToggleRight className="h-4 w-4" /> Désactiver
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-4 w-4" /> Activer
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === user.id && (
                        <tr key={`${user.id}-carte`} className="bg-[#F0F7FF]">
                          <td colSpan={6} className="px-8 pb-6 pt-0 border-b border-[#007DFF]/10">
                            <div className="border-t border-[#007DFF]/10 pt-1">
                              <PatientCartePanel
                                patientId={user.id}
                                firstName={user.firstName}
                                lastName={user.lastName}
                              />
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
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 transition-colors"
                >
                  Précédent
                </button>
                <p className="text-sm text-zinc-500">
                  Page <span className="font-semibold text-[#010C2D]">{page + 1}</span> sur{' '}
                  {totalPages}
                </p>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 transition-colors"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  )
}
