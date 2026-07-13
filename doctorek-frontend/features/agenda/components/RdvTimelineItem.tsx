'use client'

import { useState } from 'react'
import { CalendarClock, ChevronDown, ChevronUp } from 'lucide-react'
import { useMedecin } from '@/features/annuaire/hooks'
import { MedecinAvatar } from '@/features/annuaire/components/MedecinAvatar'
import { useCreneaux, useDocumentsRequis } from '@/features/agenda/hooks'
import type { QuestionnairePreConsult, RendezVous, StatutRdv } from '@/lib/types'
import { toLocalISODate } from '@/lib/date'
import { DocumentsRequisSection } from './DocumentsRequisSection'

const TYPE_CONSULTATION_LABELS: Record<string, string> = {
  CONSULTATION: 'Consultation',
  URGENCE: 'Urgence',
}

const RESCHEDULABLE: StatutRdv[] = ['EN_ATTENTE', 'CONFIRME']

const STATUT_CONFIG: Record<StatutRdv, { label: string; dot: string; text: string }> = {
  EN_ATTENTE: {
    label: 'En attente',
    dot: 'bg-amber-400',
    text: 'text-amber-600',
  },
  CONFIRME: {
    label: 'Confirmé',
    dot: 'bg-[#007DFF]',
    text: 'text-[#007DFF]',
  },
  ANNULE: {
    label: 'Annulé',
    dot: 'bg-red-400',
    text: 'text-red-500',
  },
  TERMINE: {
    label: 'Terminé',
    dot: 'bg-zinc-300',
    text: 'text-zinc-400',
  },
}

function formatDateParts(dateStr: string): { day: string; month: string } {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return {
    day: day.toString(),
    month: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date),
  }
}

function todayISO(): string {
  return toLocalISODate(new Date())
}

interface RescheduleFormProps {
  medecinId: string
  currentRdvId: string
  currentHeure: string
  isPending: boolean
  onSubmit: (date: string, heure: string) => void
  onCancel: () => void
}

function RescheduleForm({
  medecinId,
  currentRdvId: _,
  currentHeure,
  isPending,
  onSubmit,
  onCancel,
}: RescheduleFormProps) {
  const [date, setDate] = useState('')
  const [heure, setHeure] = useState('')

  const { data: creneaux, isLoading } = useCreneaux(medecinId, date)
  const available = creneaux?.filter((c) => c.disponible && c.debut !== currentHeure) ?? []

  return (
    <div className="border-t border-zinc-100 bg-[#F0F2F5] px-5 py-4 space-y-4">
      <p className="text-sm font-bold text-[#010C2D]">
        Changer la date du rendez-vous
      </p>

      <div>
        <label htmlFor={`reschedule-date-${medecinId}`} className="block text-sm font-semibold text-[#333333] mb-1.5">
          1. Choisissez un nouveau jour
        </label>
        <input
          id={`reschedule-date-${medecinId}`}
          type="date"
          min={todayISO()}
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setHeure('')
          }}
          className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30 focus:border-[#007DFF]"
        />
      </div>

      {date && (
        <div>
          <p className="text-sm font-semibold text-[#333333] mb-1.5">
            2. Choisissez une heure
          </p>
          {isLoading ? (
            <p className="text-sm text-zinc-400">Chargement des heures…</p>
          ) : available.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Ce jour est complet. Essayez un autre jour.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map((c) => (
                <button
                  key={c.debut}
                  type="button"
                  onClick={() => setHeure(c.debut)}
                  className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    heure === c.debut
                      ? 'border-[#007DFF] bg-[#007DFF] text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-[#007DFF]/40 hover:text-[#007DFF]'
                  }`}
                >
                  {c.debut}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          type="button"
          disabled={!date || !heure || isPending}
          onClick={() => onSubmit(date, heure)}
          className="min-h-[44px] rounded-xl bg-[#007DFF] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00263C] disabled:opacity-40"
        >
          {isPending ? 'Un instant…' : 'Valider la nouvelle date'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="min-h-[44px] rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-40"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

function QuestionnaireDetails({ questionnaire: q }: { questionnaire: QuestionnairePreConsult }) {
  return (
    <div className="border-t border-zinc-100 bg-[#F0F2F5] px-5 py-4">
      <p className="text-sm font-bold text-[#010C2D] mb-3">
        Vos réponses avant la consultation
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        <Row
          label="Type"
          value={TYPE_CONSULTATION_LABELS[q.typeConsultation] ?? q.typeConsultation}
        />
        <div className="sm:col-span-2">
          <Row label="Message" value={q.message} />
        </div>
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5 text-sm">
      <dt className="text-zinc-400 shrink-0">{label} :</dt>
      <dd className="text-zinc-700 font-medium">{value}</dd>
    </div>
  )
}

interface RdvTimelineItemProps {
  rdv: RendezVous
  isReprogramming: boolean
  onReprogrammer: (id: string, date: string, heure: string) => void
}

export function RdvTimelineItem({ rdv, isReprogramming, onReprogrammer }: RdvTimelineItemProps) {
  const { data: medecin } = useMedecin(rdv.medecinId)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)

  const q = rdv.questionnaire
  const config = STATUT_CONFIG[rdv.statut]
  const { day, month } = formatDateParts(rdv.dateRdv)
  const canReschedule = RESCHEDULABLE.includes(rdv.statut)
  const motif = q?.message ?? rdv.motif
  const isPast = rdv.statut === 'ANNULE' || rdv.statut === 'TERMINE'

  // Les documents demandés par le médecin sont affichés d'office (pas cachés
  // derrière un clic) : le patient doit les voir sans avoir à chercher.
  const { data: documentsRequis = [] } = useDocumentsRequis(rdv.id, canReschedule)
  const hasDocuments = documentsRequis.length > 0

  const medecinFirstName = medecin?.firstName ?? ''
  const medecinLastName = medecin?.lastName ?? ''

  const hasFooter = (q || canReschedule) && !showReschedule

  return (
    <li className="list-none">
      <div
        className={`rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-px ${isPast ? 'opacity-70' : ''}`}
      >
        <div className="flex items-stretch">

          {/* Date column — left panel */}
          <div
            className="flex flex-col items-center justify-center px-3.5 min-w-[64px] border-r border-zinc-100 bg-[#DFEFFE]"
          >
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400 capitalize">
              {month}
            </span>
            <span
              className={`text-[26px] font-black leading-none my-0.5 tabular-nums ${
                isPast ? 'text-zinc-400' : 'text-[#333333]'
              }`}
            >
              {day}
            </span>
            <span
              className={`text-[11px] font-bold tabular-nums ${
                isPast ? 'text-zinc-400' : 'text-[#007DFF]'
              }`}
            >
              {rdv.heureRdv}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between gap-3 px-4 py-3.5">

              {/* Avatar + doctor */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="shrink-0">
                  {medecin ? (
                    <MedecinAvatar
                      firstName={medecinFirstName}
                      lastName={medecinLastName}
                      photoUrl={medecin.photoUrl}
                      size="sm"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-zinc-100 animate-pulse" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[#333333] leading-tight truncate">
                    {medecin
                      ? `Dr ${medecinFirstName} ${medecinLastName}`
                      : <span className="text-zinc-300">Chargement…</span>}
                  </p>
                  {medecin && (
                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate">{medecin.specialite}</p>
                  )}
                  {motif && (
                    <p className="text-[11px] text-zinc-400 mt-1 truncate max-w-[200px] sm:max-w-xs">
                      {motif}
                    </p>
                  )}
                </div>
              </div>

              {/* Status — dot + label, no badge box */}
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dot}`} />
                <span className={`text-[11px] font-semibold ${config.text}`}>
                  {config.label}
                </span>
              </div>
            </div>

            {/* Footer actions — gros boutons clairs, cibles tactiles ≥40px */}
            {hasFooter && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-t border-zinc-50 bg-zinc-50/60">
                {q && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuestionnaire((v) => !v)
                      setShowReschedule(false)
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-[#465058] transition-colors hover:bg-zinc-100"
                    aria-expanded={showQuestionnaire}
                  >
                    {showQuestionnaire ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {showQuestionnaire ? 'Masquer mes réponses' : 'Voir mes réponses'}
                  </button>
                )}
                {canReschedule && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowReschedule((v) => !v)
                      setShowQuestionnaire(false)
                    }}
                    disabled={isReprogramming}
                    className="flex items-center gap-1.5 rounded-lg bg-[#EBF4FF] px-3 py-2 text-xs font-semibold text-[#007DFF] transition-colors hover:bg-[#DFEFFE] disabled:opacity-40"
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    Changer la date
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expandable panels */}
        {showReschedule && canReschedule && (
          <RescheduleForm
            medecinId={rdv.medecinId}
            currentRdvId={rdv.id}
            currentHeure={rdv.heureRdv}
            isPending={isReprogramming}
            onSubmit={(date, heure) => {
              onReprogrammer(rdv.id, date, heure)
              setShowReschedule(false)
            }}
            onCancel={() => setShowReschedule(false)}
          />
        )}

        {q && showQuestionnaire && <QuestionnaireDetails questionnaire={q} />}

        {/* Toujours visible quand le médecin a demandé des documents */}
        {hasDocuments && (
          <div className="border-t border-zinc-100 bg-[#FFF8E6]/60 px-5 py-4">
            <DocumentsRequisSection rdvId={rdv.id} mode="patient" />
          </div>
        )}
      </div>
    </li>
  )
}
