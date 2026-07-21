'use client'

import { Suspense, useEffect, useRef, useState, Fragment } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, CreditCard, ChevronUp, ChevronDown } from 'lucide-react'
import { useAdminUsers, useToggleUserActive } from '@/features/admin/hooks'
import type { UserSummary } from '@/features/admin/types'
import { ConfirmToggleModal } from '@/features/admin/components/ConfirmToggleModal'
import { StatusBadge, RoleBadge } from '@/features/admin/components/AdminBadges'
import { ToggleActiveButton } from '@/features/admin/components/ToggleActiveButton'
import { AdminPagination } from '@/features/admin/components/AdminPagination'
import { PatientCartePanel } from '@/features/admin/components/PatientCartePanel'

type RoleFilter = '' | 'PATIENT' | 'MEDECIN'

const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: 'Tous', value: '' },
  { label: 'Patients', value: 'PATIENT' },
  { label: 'Médecins', value: 'MEDECIN' },
]

const PAGE_SIZE = 20

function normalizeRole(raw: string | null): RoleFilter {
  return raw === 'PATIENT' || raw === 'MEDECIN' ? raw : ''
}

function UtilisateursContent() {
  const searchParams = useSearchParams()
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(() => normalizeRole(searchParams.get('role')))
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingToggle, setPendingToggle] = useState<UserSummary | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, isLoading, error } = useAdminUsers(roleFilter, debouncedSearch, page, PAGE_SIZE)
  const toggle = useToggleUserActive()

  // Deep link support: /utilisateurs?role=PATIENT preselects the tab.
  // setState pendant le rendu (pattern React "derive state from props") — pas d'effet.
  const [prevParams, setPrevParams] = useState(searchParams)
  if (prevParams !== searchParams) {
    setPrevParams(searchParams)
    setRoleFilter(normalizeRole(searchParams.get('role')))
    setPage(0)
  }

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
    setExpandedId(null)
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function handleConfirmToggle() {
    if (!pendingToggle) return
    toggle.mutate(pendingToggle.id, { onSettled: () => setPendingToggle(null) })
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0
  const noun = roleFilter === 'PATIENT' ? 'patient' : roleFilter === 'MEDECIN' ? 'médecin' : 'utilisateur'

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

      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#010C2D]">Utilisateurs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Comptes patients et médecins : recherche, consultation et activation.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleRoleChange(tab.value)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                  roleFilter === tab.value ? 'bg-[#007DFF] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex max-w-sm flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 focus-within:ring-2 focus-within:ring-[#007DFF]/20">
            <Search className="h-4 w-4 shrink-0 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Nom, email, spécialité…"
              className="flex-1 bg-transparent text-sm text-[#010C2D] outline-none placeholder:text-zinc-400"
            />
          </div>

          {data && (
            <p className="ml-auto text-sm text-zinc-500">
              <span className="font-semibold text-[#010C2D]">{data.total.toLocaleString('fr-FR')}</span>{' '}
              {noun}
              {data.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="space-y-px">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse border-b border-zinc-100 bg-zinc-50 last:border-0" />
              ))}
            </div>
          ) : error ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-red-500">Erreur lors du chargement.</p>
            </div>
          ) : !data?.content?.length ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-zinc-400">Aucun {noun} trouvé.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-[#F8F9FB]">
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Nom</th>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Email</th>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Rôle</th>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Spécialité / Ville</th>
                      <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">Statut</th>
                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {data.content.map((user) => {
                      const expandable = user.role === 'PATIENT' && user.hasCarteVirtuelle
                      const expanded = expandedId === user.id
                      return (
                        <Fragment key={user.id}>
                          <tr
                            className={`transition-colors ${
                              expandable ? 'cursor-pointer hover:bg-[#F0F7FF]' : 'hover:bg-zinc-50'
                            } ${expanded ? 'bg-[#F0F7FF]' : ''}`}
                            onClick={() => expandable && toggleExpand(user.id)}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-[#010C2D]">
                                  {user.firstName} {user.lastName}
                                </p>
                                {expandable && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F2FC] px-2 py-0.5 text-[10px] font-semibold text-[#007DFF]">
                                    <CreditCard className="h-2.5 w-2.5" /> Carte
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-zinc-500">{user.email}</td>
                            <td className="px-5 py-3.5">
                              <RoleBadge role={user.role} />
                            </td>
                            <td className="px-5 py-3.5 text-zinc-500">
                              {user.specialite || user.ville
                                ? [user.specialite, user.ville].filter(Boolean).join(' · ')
                                : '—'}
                            </td>
                            <td className="px-5 py-3.5">
                              <StatusBadge active={user.active} />
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-2">
                                {expandable &&
                                  (expanded ? (
                                    <ChevronUp className="h-4 w-4 text-[#007DFF]" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                                  ))}
                                <ToggleActiveButton
                                  active={user.active}
                                  disabled={toggle.isPending}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPendingToggle(user)
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="bg-[#F0F7FF]">
                              <td colSpan={6} className="border-b border-[#007DFF]/10 px-8 pb-6 pt-0">
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
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <AdminPagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function AdminUtilisateursPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />}>
      <UtilisateursContent />
    </Suspense>
  )
}
