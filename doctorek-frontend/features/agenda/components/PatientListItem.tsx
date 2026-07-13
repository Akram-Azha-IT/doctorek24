'use client'

import type { PatientSummary, StatutRdv } from '@/lib/types'

const STATUT_LABELS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
}

const STATUT_COLORS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'bg-[#FFF8E6] text-[#B7791F]',
  CONFIRME: 'bg-[#E6F8F0] text-[#1B7A4E]',
  ANNULE: 'bg-[#FFDEDE] text-[#B4232A]',
  TERMINE: 'bg-[#F0F2F5] text-[#6B7A99]',
}

function hslFromName(firstName: string, lastName: string): string {
  const str = `${firstName}${lastName}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = ((hash % 360) + 360) % 360
  return `hsl(${h} 55% 45%)`
}

function formatDateShortFR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

interface PatientListItemProps {
  patient: PatientSummary
  onClick: () => void
}

export function PatientListItem({ patient, onClick }: PatientListItemProps) {
  const initials = `${patient.firstName[0] ?? ''}${patient.lastName[0] ?? ''}`.toUpperCase()
  const color = hslFromName(patient.firstName, patient.lastName)

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#FAFBFC] focus-visible:bg-[#FAFBFC] focus-visible:outline-none"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: color }}
          aria-hidden
        >
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#010C2D]">
            {patient.firstName} {patient.lastName}
          </p>
          <p className="mt-0.5 text-xs text-[#A0AEC0]">
            Dernier RDV : {formatDateShortFR(patient.dernierRdvDate)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {patient.hasFutureRdv && (
            <span className="hidden rounded-full bg-[#EBF4FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#007DFF] sm:inline-flex">
              RDV à venir
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUT_COLORS[patient.dernierRdvStatut]}`}
          >
            {STATUT_LABELS[patient.dernierRdvStatut]}
          </span>
          <svg
            className="h-4 w-4 text-[#C4CFDD]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </li>
  )
}
