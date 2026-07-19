'use client'

import { CalendarDays, Mail, BellRing, Pencil, UserMinus, ShieldCheck } from 'lucide-react'
import type { Proche } from '@/lib/types'
import { ROLE_GESTION_LABELS } from '../schemas'
import { ProcheAvatar } from './ProcheAvatar'

interface ProchesListProps {
  proches: Proche[]
  onEdit: (proche: Proche) => void
  onRemove: (proche: Proche) => void
  isRemoving: boolean
}

function formatDateNaissance(iso: string | null): string | null {
  if (!iso) return null
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(iso + 'T00:00:00'))
}

function computeAge(iso: string | null): number | null {
  if (!iso) return null
  const birth = new Date(iso + 'T00:00:00')
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const before = now.getMonth() < birth.getMonth()
    || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  if (before) age -= 1
  return age >= 0 ? age : null
}

export function ProchesList({ proches, onEdit, onRemove, isRemoving }: ProchesListProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {proches.map((proche) => {
        const age = computeAge(proche.dateNaissance)
        const date = formatDateNaissance(proche.dateNaissance)
        return (
          <li
            key={proche.id}
            className="group relative flex flex-col rounded-2xl border border-[#EDF1F5] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B6DAF7] hover:shadow-md"
          >
            {/* Bandeau identité */}
            <div className="flex items-start gap-3.5">
              <ProcheAvatar firstName={proche.prenom} lastName={proche.nom} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-[#010C2D]">
                  {proche.prenom} {proche.nom}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {proche.role && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F6EE] px-2.5 py-0.5 text-[11px] font-semibold text-[#0B7A4B]">
                      <ShieldCheck className="h-3 w-3" />
                      {ROLE_GESTION_LABELS[proche.role]}
                    </span>
                  )}
                  {proche.mineur && (
                    <span className="rounded-full bg-[#FFF3DC] px-2.5 py-0.5 text-[11px] font-semibold text-[#B7791F]">
                      Mineur{age !== null ? ` · ${age} ans` : ''}
                    </span>
                  )}
                  {!proche.mineur && age !== null && (
                    <span className="rounded-full bg-[#F1F4F7] px-2.5 py-0.5 text-[11px] font-semibold text-[#465058]">
                      {age} ans
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Infos */}
            <div className="mt-4 space-y-1.5 border-t border-zinc-100 pt-3.5 text-[13px]">
              <p className="flex items-center gap-2 text-[#465058]">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                {date ?? 'Date de naissance non renseignée'}
              </p>
              {proche.email ? (
                <p className="flex items-center gap-2 truncate text-[#465058]">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  <span className="truncate">{proche.email}</span>
                </p>
              ) : (
                <p className="flex items-center gap-2 text-[#B7791F]">
                  <BellRing className="h-3.5 w-3.5 shrink-0" />
                  Vous recevez ses notifications
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(proche)}
                className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-[#465058] transition-colors hover:border-[#007DFF] hover:text-[#007DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/40 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </button>
              <button
                type="button"
                onClick={() => onRemove(proche)}
                disabled={isRemoving}
                aria-label={`Retirer ${proche.prenom} ${proche.nom}`}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 text-sm font-medium text-[#E01E5A] transition-colors hover:bg-[#FFF0F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E01E5A]/40 disabled:opacity-50 cursor-pointer"
              >
                <UserMinus className="h-3.5 w-3.5" />
                Retirer
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
