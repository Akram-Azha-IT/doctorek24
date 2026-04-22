'use client'

import { useState } from 'react'
import { useMedecin } from '@/features/annuaire/hooks'
import type { QuestionnairePreConsult, RendezVous, StatutRdv } from '@/lib/types'

const DUREE_LABELS: Record<string, string> = {
  moins_7j: 'Moins de 7 jours',
  '1_4sem': '1 à 4 semaines',
  plus_1mois: "Plus d'un mois",
}

const CANCELLABLE: StatutRdv[] = ['EN_ATTENTE', 'CONFIRME']

const STATUT_LABELS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ANNULE: 'Annulé',
  TERMINE: 'Terminé',
}

const STATUT_COLORS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
  CONFIRME: 'bg-emerald-100 text-emerald-700',
  ANNULE: 'bg-red-100 text-red-600',
  TERMINE: 'bg-zinc-100 text-zinc-500',
}

const DOT_COLORS: Record<StatutRdv, string> = {
  EN_ATTENTE: 'bg-yellow-400 ring-yellow-100',
  CONFIRME: 'bg-emerald-500 ring-emerald-100',
  ANNULE: 'bg-red-400 ring-red-100',
  TERMINE: 'bg-zinc-400 ring-zinc-100',
}

function formatDateFR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

interface RdvTimelineItemProps {
  rdv: RendezVous
  isLast: boolean
  confirmingId: string | null
  isAnnuling: boolean
  onConfirmStart: (id: string) => void
  onConfirmCancel: () => void
  onAnnuler: (id: string) => void
}

export function RdvTimelineItem({
  rdv,
  isLast,
  confirmingId,
  isAnnuling,
  onConfirmStart,
  onConfirmCancel,
  onAnnuler,
}: RdvTimelineItemProps) {
  const { data: medecin } = useMedecin(rdv.medecinId)
  const medecinNom = medecin ? `Dr ${medecin.firstName} ${medecin.lastName}` : 'Médecin…'
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const q = rdv.questionnaire

  return (
    <li className="relative pl-10">
      {/* Vertical rail */}
      {!isLast && (
        <span
          className="absolute left-[15px] top-6 bottom-[-12px] w-px bg-zinc-200"
          aria-hidden
        />
      )}

      {/* Dot */}
      <span
        className={`absolute left-2 top-5 h-3 w-3 rounded-full ring-4 ${DOT_COLORS[rdv.statut]}`}
        aria-hidden
      />

      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900">{medecinNom}</p>
            {medecin && <p className="text-xs text-zinc-500">{medecin.specialite}</p>}
            <p className="text-sm text-zinc-700 mt-1 capitalize">
              {formatDateFR(rdv.dateRdv)} à {rdv.heureRdv}
            </p>
            {q?.motif && (
              <p className="text-xs text-zinc-400 mt-0.5 italic truncate max-w-[320px]">
                {q.motif}
              </p>
            )}
            {!q && rdv.motif && (
              <p className="text-xs text-zinc-400 mt-0.5 italic">{rdv.motif}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUT_COLORS[rdv.statut]}`}
            >
              {STATUT_LABELS[rdv.statut]}
            </span>

            {q && (
              <button
                type="button"
                onClick={() => setShowQuestionnaire((v) => !v)}
                className="text-xs text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded border border-zinc-200 hover:border-zinc-300 transition-colors"
                aria-expanded={showQuestionnaire}
              >
                {showQuestionnaire ? 'Masquer' : 'Détails'}
              </button>
            )}

            {CANCELLABLE.includes(rdv.statut) && confirmingId !== rdv.id && (
              <button
                onClick={() => onConfirmStart(rdv.id)}
                disabled={isAnnuling}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                Annuler
              </button>
            )}

            {confirmingId === rdv.id && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Confirmer ?</span>
                <button
                  onClick={() => onAnnuler(rdv.id)}
                  disabled={isAnnuling}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {isAnnuling ? '…' : 'Oui'}
                </button>
                <button
                  onClick={onConfirmCancel}
                  disabled={isAnnuling}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                >
                  Non
                </button>
              </div>
            )}
          </div>
        </div>

        {q && showQuestionnaire && <QuestionnaireDetails questionnaire={q} />}
      </div>
    </li>
  )
}

function QuestionnaireDetails({ questionnaire: q }: { questionnaire: QuestionnairePreConsult }) {
  return (
    <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
        Questionnaire pré-consultation
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Row label="Motif" value={q.motif} />
        <Row label="Premier RDV" value={q.premierConsultation ? 'Oui' : 'Non'} />
        {q.dureeSymptoomes && (
          <Row label="Durée symptômes" value={DUREE_LABELS[q.dureeSymptoomes] ?? q.dureeSymptoomes} />
        )}
        {q.intensiteDouleur != null && (
          <Row label="Intensité gêne" value={`${q.intensiteDouleur} / 5`} />
        )}
        {q.notesComplementaires && (
          <div className="sm:col-span-2">
            <Row label="Notes" value={q.notesComplementaires} />
          </div>
        )}
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-zinc-400 shrink-0">{label} :</dt>
      <dd className="text-zinc-700 font-medium">{value}</dd>
    </div>
  )
}
