'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Clock3,
  Mail,
  MoreVertical,
  ShieldCheck,
  Trash2,
  UserRoundPen,
} from 'lucide-react'
import type { Proche } from '@/lib/types'
import { ROLE_GESTION_LABELS } from '../schemas'
import { ProcheAvatar } from './ProcheAvatar'

interface ProchesListProps {
  proches: Proche[]
  selectedId: string
  onSelect: (id: string) => void
  onEdit: (proche: Proche) => void
  onRemove: (proche: Proche) => void
  isRemoving: boolean
}

function formatDateNaissance(iso: string | null): string | null {
  if (!iso) return null
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${iso}T00:00:00`))
}

function computeAge(iso: string | null): number | null {
  if (!iso) return null
  const birth = new Date(`${iso}T00:00:00`)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const beforeBirthday = now.getMonth() < birth.getMonth()
    || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  if (beforeBirthday) age -= 1
  return age >= 0 ? age : null
}

export function ProchesList({
  proches,
  selectedId,
  onSelect,
  onEdit,
  onRemove,
  isRemoving,
}: ProchesListProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const selected = proches.find((proche) => proche.id === selectedId) ?? proches[0]

  if (!selected) return null

  const age = computeAge(selected.dateNaissance)
  const birthDate = formatDateNaissance(selected.dateNaissance)
  const relationship = selected.role ? ROLE_GESTION_LABELS[selected.role] : null

  function selectProfile(id: string) {
    onSelect(id)
    setMenuOpen(false)
  }

  return (
    <div className="mt-5 space-y-4 sm:mt-7 sm:space-y-5">
      <div
        className="-mx-4 flex max-w-none snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:max-w-[780px] sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
        role="tablist"
        aria-label="Choisir un profil"
      >
        {proches.map((proche) => {
          const active = proche.id === selected.id
          return (
            <button
              key={proche.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="proche-actif"
              onClick={() => selectProfile(proche.id)}
              className={`flex min-h-[72px] w-[152px] shrink-0 snap-start touch-manipulation items-center gap-2 rounded-xl border bg-white px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/35 focus-visible:ring-offset-2 sm:min-h-[88px] sm:w-auto sm:min-w-0 sm:gap-3 sm:rounded-2xl sm:px-4 ${
                active
                  ? 'border-[#007DFF] shadow-[0_0_0_2px_rgba(0,125,255,0.10)]'
                  : 'border-[#D7E0EC] hover:border-[#9CC9F7] hover:bg-[#FBFDFF]'
              }`}
            >
              <span className="hidden sm:block">
                <ProcheAvatar firstName={proche.prenom} lastName={proche.nom} size="md" />
              </span>
              <span className="sm:hidden">
                <ProcheAvatar firstName={proche.prenom} lastName={proche.nom} size="sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-[#010C2D] sm:text-base">
                  {proche.prenom} {proche.nom}
                </span>
                <span className={`mt-0.5 block truncate text-xs font-semibold sm:hidden ${
                  proche.self ? 'text-[#64748B]' : 'text-[#17734D]'
                }`}>
                  {proche.self ? 'Moi' : 'Proche géré'}
                </span>
              </span>
              <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${
                proche.self
                  ? 'bg-[#F1F4F7] text-[#52627A]'
                  : 'bg-[#E8F8F1] text-[#17734D]'
              }`}>
                {proche.self ? 'Moi' : 'Proche géré'}
              </span>
            </button>
          )
        })}
      </div>

      <section
        id="proche-actif"
        role="tabpanel"
        className="relative overflow-visible rounded-2xl border border-[#D7E0EC] bg-white shadow-[0_6px_20px_rgba(1,38,60,0.045)] sm:rounded-[20px]"
      >
        <div className={`relative flex items-center gap-3 px-4 py-4 sm:gap-5 sm:px-7 sm:py-7 ${selected.self ? '' : 'pr-16 sm:pr-7'}`}>
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <ProcheAvatar firstName={selected.prenom} lastName={selected.nom} size="xl" />
            <div className="min-w-0">
              <h2 className="truncate font-heading text-xl font-bold tracking-[-0.025em] text-[#010C2D] sm:text-[28px]">
                {selected.prenom} {selected.nom}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {selected.self ? (
                  <span className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-semibold text-[#0064CE]">
                    Mon profil
                  </span>
                ) : relationship ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F8F1] px-3 py-1 text-xs font-semibold text-[#17734D]">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {relationship}
                  </span>
                ) : null}
                {age !== null && (
                  <span className="rounded-full bg-[#F1F4F7] px-3 py-1 text-xs font-semibold text-[#52627A]">
                    {age} ans
                  </span>
                )}
              </div>
            </div>
          </div>

          {!selected.self && (
            <div className="absolute right-3 top-3 sm:right-6 sm:top-6">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={`Actions pour ${selected.prenom} ${selected.nom}`}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl border border-[#D7E0EC] bg-white text-[#52627A] transition-colors hover:bg-[#F1F6FD] hover:text-[#010C2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/35 sm:h-12 sm:w-12"
              >
                <MoreVertical className="h-5 w-5" aria-hidden="true" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-[#D7E0EC] bg-white p-1.5 shadow-[0_12px_30px_rgba(1,38,60,0.14)]"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      onRemove(selected)
                    }}
                    disabled={isRemoving}
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-semibold text-[#C52D34] transition-colors hover:bg-[#FFF0F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E01E5A]/30 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {isRemoving ? 'Retrait en cours...' : 'Retirer ce proche'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <dl className="grid gap-3 border-t border-[#E5EAF1] px-4 py-3.5 text-sm text-[#52627A] sm:grid-cols-2 sm:gap-4 sm:px-7 sm:py-5">
          <ProfileDetail icon={Mail} label="Adresse e-mail" value={selected.email || 'Non renseignée'} />
          <ProfileDetail icon={CalendarDays} label="Date de naissance" value={birthDate || 'Non renseignée'} />
        </dl>

        <div className="border-t border-[#E5EAF1] px-4 py-4 sm:px-7 sm:py-6">
          <h3 className="font-heading text-base font-bold text-[#010C2D] sm:text-lg">
            {selected.self
              ? 'Que souhaitez-vous faire ?'
              : `Que souhaitez-vous faire pour ${selected.prenom} ?`}
          </h3>
          <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3 md:grid-cols-3">
            <ActionLink href="/recherche" icon={CalendarPlus} label="Prendre rendez-vous" />
            <ActionLink
              href="/dashboard/patient/rdvs"
              icon={Clock3}
              label={selected.self ? 'Mes rendez-vous' : 'Voir ses rendez-vous'}
            />
            {selected.self ? (
              <ActionLink
                href="/dashboard/patient/compte"
                icon={UserRoundPen}
                label="Modifier mes informations"
              />
            ) : (
              <button
                type="button"
                onClick={() => onEdit(selected)}
                className="group flex min-h-16 touch-manipulation items-center gap-3 rounded-xl border border-[#D7E0EC] bg-white py-2 pl-4 pr-16 text-left transition-colors hover:border-[#86BEF5] hover:bg-[#F8FBFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/30 sm:pr-4 md:min-h-[96px] md:gap-4 md:rounded-2xl md:px-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#007DFF]">
                  <UserRoundPen className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-semibold leading-5 text-[#010C2D]">Modifier ses informations</span>
                <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-[#8293A5] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-[#D7E0EC] bg-white px-4 py-3.5 text-sm leading-5 text-[#52627A] shadow-[0_4px_14px_rgba(1,38,60,0.035)] sm:rounded-2xl sm:px-5 sm:py-4 sm:leading-6">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F8F1] text-[#2EB67D]">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <p>
          {selected.self
            ? 'Sélectionnez un proche pour agir en son nom et suivre ses rendez-vous.'
            : selected.email
              ? `${selected.prenom} reçoit les notifications concernant ses rendez-vous et ses informations.`
              : `Vous recevez les notifications concernant les rendez-vous de ${selected.prenom}.`}
        </p>
      </div>
    </div>
  )
}

function ProfileDetail({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#8293A5]" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#8293A5]">{label}</dt>
        <dd className="mt-1 truncate font-medium text-[#34425A]">{value}</dd>
      </div>
    </div>
  )
}

function ActionLink({ href, icon: Icon, label }: { href: string; icon: typeof CalendarPlus; label: string }) {
  return (
    <Link
      href={href}
      className="group flex min-h-16 touch-manipulation items-center gap-3 rounded-xl border border-[#D7E0EC] bg-white py-2 pl-4 pr-16 transition-colors hover:border-[#86BEF5] hover:bg-[#F8FBFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/30 sm:pr-4 md:min-h-[96px] md:gap-4 md:rounded-2xl md:px-5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#007DFF]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="font-semibold leading-5 text-[#010C2D]">{label}</span>
      <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-[#8293A5] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}
