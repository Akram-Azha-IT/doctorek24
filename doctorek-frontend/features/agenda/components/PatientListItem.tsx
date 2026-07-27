'use client'

import { Avatar } from '@/components/Avatar'
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
  readonly patient: PatientSummary
  readonly onClick: () => void
}

export function PatientListItem({ patient, onClick }: PatientListItemProps) {
  const fullName = `${patient.firstName} ${patient.lastName}`.trim()

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-label={`Ouvrir le dossier de ${fullName}`}
        className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F7FAFF] focus-visible:bg-[#F7FAFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#007DFF]/40"
      >
        <div className="relative shrink-0">
          <Avatar name={fullName} photoUrl={patient.photoUrl} size={44} />
          {/* Pastille de suivi : repérer d'un coup d'œil qui revient bientôt. */}
          {patient.hasFutureRdv && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#007DFF]"
              title="Rendez-vous à venir"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-[#010C2D]">{fullName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#6B7A99]">
            <svg className="h-3 w-3 shrink-0 text-[#A0AEC0]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Dernier RDV : {formatDateShortFR(patient.dernierRdvDate)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {patient.hasFutureRdv && (
            <span className="hidden rounded-full bg-[#EBF4FF] px-2.5 py-1 text-[11px] font-semibold text-[#007DFF] sm:inline-flex">
              RDV à venir
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUT_COLORS[patient.dernierRdvStatut]}`}>
            {STATUT_LABELS[patient.dernierRdvStatut]}
          </span>
          <svg
            className="h-4 w-4 text-[#C4CFDD] transition-transform group-hover:translate-x-0.5 group-hover:text-[#007DFF]"
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
