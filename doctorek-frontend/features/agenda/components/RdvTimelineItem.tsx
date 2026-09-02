'use client'

import { useState } from 'react'
import {
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  FileText,
  MapPin,
  Star,
} from 'lucide-react'
import { useMedecin } from '@/features/annuaire/hooks'
import { AvisFormModal } from '@/features/avis/components/AvisFormModal'
import { MedecinAvatar } from '@/features/annuaire/components/MedecinAvatar'
import { useCreneaux, useDocumentsRequis } from '@/features/agenda/hooks'
import type { QuestionnairePreConsult, RendezVous, StatutRdv } from '@/lib/types'
import { toLocalISODate } from '@/lib/date'
import { statutAffiche } from '../rdv-timeline'
import { DocumentsRequisSection } from './DocumentsRequisSection'

const TYPE_CONSULTATION_LABELS: Record<string, string> = {
  CONSULTATION: 'Consultation',
  URGENCE: 'Urgence',
}

const RESCHEDULABLE: StatutRdv[] = ['EN_ATTENTE', 'CONFIRME']

const STATUT_CONFIG: Record<StatutRdv, { label: string; dot: string; text: string; surface: string }> = {
  EN_ATTENTE: {
    label: 'En attente',
    dot: 'bg-[#F5A623]',
    text: 'text-[#956000]',
    surface: 'bg-[#FFF7E4]',
  },
  CONFIRME: {
    label: 'Confirmé',
    dot: 'bg-[#2EB67D]',
    text: 'text-[#17734D]',
    surface: 'bg-[#E8F8F1]',
  },
  ANNULE: {
    label: 'Annulé',
    dot: 'bg-[#F04444]',
    text: 'text-[#C52D34]',
    surface: 'bg-[#FFF0F1]',
  },
  TERMINE: {
    label: 'Terminé',
    dot: 'bg-[#2EB67D]',
    text: 'text-[#17734D]',
    surface: 'bg-[#E8F8F1]',
  },
}

function dateFromISO(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDateLong(dateStr: string): string {
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateFromISO(dateStr))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function todayISO(): string {
  return toLocalISODate(new Date())
}

interface RescheduleFormProps {
  readonly medecinId: string
  readonly currentHeure: string
  readonly isPending: boolean
  readonly onSubmit: (date: string, heure: string) => void
  readonly onCancel: () => void
}

function RescheduleForm({
  medecinId,
  currentHeure,
  isPending,
  onSubmit,
  onCancel,
}: RescheduleFormProps) {
  const [date, setDate] = useState('')
  const [heure, setHeure] = useState('')
  const { data: creneaux, isLoading } = useCreneaux(medecinId, date)
  const available = creneaux?.filter((creneau) => creneau.disponible && creneau.debut !== currentHeure) ?? []

  return (
    <div className="border-t border-[#E5EAF1] bg-[#F7FAFE] px-5 py-5 sm:px-6">
      <p className="text-sm font-bold text-[#010C2D]">Changer la date du rendez-vous</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]">
        <div>
          <label htmlFor={`reschedule-date-${medecinId}`} className="mb-1.5 block text-sm font-semibold text-[#34425A]">
            Nouveau jour
          </label>
          <input
            id={`reschedule-date-${medecinId}`}
            type="date"
            min={todayISO()}
            value={date}
            onChange={(event) => {
              setDate(event.target.value)
              setHeure('')
            }}
            className="min-h-11 w-full rounded-xl border border-[#CFD8E6] bg-white px-3.5 text-sm text-[#010C2D] outline-none transition focus:border-[#007DFF] focus:ring-2 focus:ring-[#007DFF]/15"
          />
        </div>

        {date && (
          <div>
            <p className="mb-1.5 text-sm font-semibold text-[#34425A]">Nouvelle heure</p>
            {isLoading ? (
              <p className="py-3 text-sm text-[#71809A]">Chargement des horaires...</p>
            ) : available.length === 0 ? (
              <p className="py-3 text-sm text-[#52627A]">Ce jour est complet. Essayez un autre jour.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {available.map((creneau) => (
                  <button
                    key={creneau.debut}
                    type="button"
                    onClick={() => setHeure(creneau.debut)}
                    className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      heure === creneau.debut
                        ? 'border-[#007DFF] bg-[#007DFF] text-white'
                        : 'border-[#CFD8E6] bg-white text-[#34425A] hover:border-[#007DFF] hover:text-[#007DFF]'
                    }`}
                  >
                    {creneau.debut}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={!date || !heure || isPending}
          onClick={() => onSubmit(date, heure)}
          className="min-h-11 rounded-xl bg-[#007DFF] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0069D7] disabled:opacity-40"
        >
          {isPending ? 'Un instant...' : 'Valider la nouvelle date'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="min-h-11 rounded-xl border border-[#CFD8E6] bg-white px-4 text-sm font-semibold text-[#52627A] transition-colors hover:bg-[#F1F6FD] disabled:opacity-40"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

function QuestionnaireDetails({ questionnaire }: { questionnaire: QuestionnairePreConsult }) {
  return (
    <div className="rounded-xl border border-[#DCE4EF] bg-white p-4">
      <p className="text-sm font-bold text-[#010C2D]">Motif de la consultation</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <Row
          label="Type"
          value={TYPE_CONSULTATION_LABELS[questionnaire.typeConsultation] ?? questionnaire.typeConsultation}
        />
        <div className="sm:col-span-2">
          <Row label="Message" value={questionnaire.message} />
        </div>
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="shrink-0 text-[#71809A]">{label} :</dt>
      <dd className="font-medium text-[#34425A]">{value}</dd>
    </div>
  )
}

interface RdvTimelineItemProps {
  readonly rdv: RendezVous
  readonly isReprogramming: boolean
  readonly onReprogrammer: (id: string, date: string, heure: string) => void
  readonly isCancelling?: boolean
  readonly onAnnuler?: (id: string) => void
  readonly peutNoter?: boolean
  readonly variant?: 'featured' | 'history' | 'upcoming'
}

export function RdvTimelineItem({
  rdv,
  isReprogramming,
  onReprogrammer,
  isCancelling,
  onAnnuler,
  peutNoter,
  variant = 'upcoming',
}: RdvTimelineItemProps) {
  const { data: medecin } = useMedecin(rdv.medecinId)
  const [showPreparation, setShowPreparation] = useState(false)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [showAvis, setShowAvis] = useState(false)
  const [avisDepose, setAvisDepose] = useState(false)

  const questionnaire = rdv.questionnaire
  const statut = statutAffiche(rdv)
  const config = STATUT_CONFIG[statut]
  const canReschedule = RESCHEDULABLE.includes(statut)
  const motif = questionnaire?.message ?? rdv.motif
  const { data: documentsRequis = [] } = useDocumentsRequis(rdv.id, canReschedule)
  const preparationCount = (motif ? 1 : 0) + documentsRequis.length

  const medecinFirstName = medecin?.firstName ?? ''
  const medecinLastName = medecin?.lastName ?? ''
  const medecinName = medecin ? `Dr ${medecinFirstName} ${medecinLastName}` : 'Chargement...'
  const location = medecin?.adresse || medecin?.ville || 'Lieu à confirmer'
  const canCancel = canReschedule && !!onAnnuler
  const canNoter = !!peutNoter && !avisDepose && !!medecin

  function toggleReschedule() {
    setShowReschedule((value) => !value)
    setShowPreparation(false)
    setShowQuestionnaire(false)
    setConfirmCancel(false)
  }

  function renderCancellation() {
    if (!canCancel) return null

    if (confirmCancel) {
      return (
        <div className="flex flex-wrap items-center justify-end gap-2" role="group" aria-label="Confirmer l'annulation">
          <span className="text-xs font-medium text-[#52627A]">Annuler ce rendez-vous ?</span>
          <button
            type="button"
            onClick={() => {
              onAnnuler?.(rdv.id)
              setConfirmCancel(false)
            }}
            disabled={isCancelling}
            className="min-h-10 rounded-lg bg-[#E01E5A] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#C5164B] disabled:opacity-40"
          >
            {isCancelling ? 'Annulation...' : 'Oui, annuler'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmCancel(false)}
            className="min-h-10 rounded-lg border border-[#CFD8E6] bg-white px-3 text-xs font-semibold text-[#52627A] hover:bg-[#F1F6FD]"
          >
            Non
          </button>
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={() => {
          setConfirmCancel(true)
          setShowReschedule(false)
          setShowPreparation(false)
        }}
        disabled={isCancelling}
        className="min-h-10 px-2 text-sm font-semibold text-[#D62F3A] transition-colors hover:text-[#A61F29] disabled:opacity-40"
      >
        Annuler
      </button>
    )
  }

  function renderExpandedPanels() {
    return (
      <>
        {showReschedule && canReschedule && (
          <RescheduleForm
            medecinId={rdv.medecinId}
            currentHeure={rdv.heureRdv}
            isPending={isReprogramming}
            onSubmit={(date, heure) => {
              onReprogrammer(rdv.id, date, heure)
              setShowReschedule(false)
            }}
            onCancel={() => setShowReschedule(false)}
          />
        )}

        {questionnaire && showQuestionnaire && (
          <div className="border-t border-[#E5EAF1] bg-[#F7FAFE] px-5 py-4 sm:px-6">
            <QuestionnaireDetails questionnaire={questionnaire} />
          </div>
        )}
      </>
    )
  }

  const status = (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${config.surface} ${config.text}`}>
      <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  )

  if (variant === 'featured') {
    return (
      <li className="list-none">
        <article className="overflow-hidden rounded-2xl border border-[#D7E0EC] bg-white shadow-[0_8px_24px_rgba(1,38,60,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 sm:px-6">
            <h2 className="font-heading text-xl font-bold tracking-[-0.02em] text-[#010C2D]">Prochain rendez-vous</h2>
            {status}
          </div>

          <div className="grid gap-5 px-5 py-4 sm:px-6 lg:grid-cols-[1.05fr_1.65fr_260px] lg:items-center">
            <div className="flex min-w-0 items-center gap-3.5">
              {medecin ? (
                <MedecinAvatar
                  firstName={medecinFirstName}
                  lastName={medecinLastName}
                  photoUrl={medecin.photoUrl}
                  size="lg"
                />
              ) : (
                <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-[#EAF1FA]" />
              )}
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-[#010C2D]">{medecinName}</p>
                {medecin && <p className="mt-1 truncate text-sm font-medium text-[#2D5A9A]">{medecin.specialite}</p>}
                <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-[#64748B]">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="line-clamp-2">{location}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 sm:divide-x sm:divide-[#E5EAF1]">
              <Metadata icon={CalendarDays} value={formatDateLong(rdv.dateRdv)} />
              <Metadata icon={Clock3} value={rdv.heureRdv} className="sm:pl-4" />
              <Metadata icon={MapPin} value={location} className="sm:pl-4" />
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowPreparation(true)
                  setShowReschedule(false)
                }}
                className="min-h-11 rounded-xl bg-[#007DFF] px-5 text-sm font-bold text-white transition-colors hover:bg-[#0069D7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/35 focus-visible:ring-offset-2"
              >
                Préparer mon rendez-vous
              </button>
              <div className="flex flex-wrap items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={toggleReschedule}
                  disabled={isReprogramming}
                  className="min-h-10 text-sm font-semibold text-[#007DFF] hover:text-[#005EBF] disabled:opacity-40"
                >
                  Changer la date
                </button>
                {renderCancellation()}
              </div>
            </div>
          </div>

          <div className="border-t border-[#E5EAF1] px-5 py-2.5 sm:px-6">
            <button
              type="button"
              onClick={() => {
                setShowPreparation((value) => !value)
                setShowReschedule(false)
              }}
              aria-expanded={showPreparation}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-[#DCE4EF] px-4 text-left text-sm text-[#34425A] transition-colors hover:bg-[#F7FAFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/25"
            >
              <FileText className="h-4 w-4 shrink-0 text-[#2D5A9A]" aria-hidden="true" />
              <span className="font-semibold">Motif et documents à préparer</span>
              <span className="hidden text-[#71809A] sm:inline">
                {preparationCount} élément{preparationCount > 1 ? 's' : ''}
              </span>
              {showPreparation ? (
                <ChevronUp className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
              )}
            </button>
          </div>

          {showPreparation && (
            <div className="grid gap-4 border-t border-[#E5EAF1] bg-[#F7FAFE] px-5 py-5 sm:px-6 lg:grid-cols-2">
              {questionnaire ? (
                <QuestionnaireDetails questionnaire={questionnaire} />
              ) : (
                <div className="rounded-xl border border-[#DCE4EF] bg-white p-4">
                  <p className="text-sm font-bold text-[#010C2D]">Motif de la consultation</p>
                  <p className="mt-2 text-sm leading-6 text-[#52627A]">{motif || 'Aucun motif renseigné.'}</p>
                </div>
              )}
              <div className="rounded-xl border border-[#DCE4EF] bg-white p-4">
                <DocumentsRequisSection rdvId={rdv.id} mode="patient" />
              </div>
            </div>
          )}

          {renderExpandedPanels()}
        </article>

        {showAvis && medecin && (
          <AvisFormModal
            rdvId={rdv.id}
            medecinId={rdv.medecinId}
            medecinNom={`${medecinFirstName} ${medecinLastName}`.trim()}
            onClose={() => setShowAvis(false)}
            onSuccess={() => setAvisDepose(true)}
          />
        )}
      </li>
    )
  }

  return (
    <li className="list-none">
      <article className="relative">
        <div className="grid min-h-[56px] gap-3 px-4 py-2 sm:grid-cols-[190px_1fr_auto] sm:items-center sm:px-5">
          <div className="flex items-center gap-3">
            <span className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`} aria-hidden="true" />
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${statut === 'ANNULE' ? 'bg-[#FFF0F1] text-[#F04444]' : 'bg-[#EAF3FF] text-[#007DFF]'}`}>
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#10213F]">{formatDateLong(rdv.dateRdv)}</p>
              <p className="mt-0.5 text-sm tabular-nums text-[#64748B]">{rdv.heureRdv}</p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-3 sm:border-l sm:border-[#E5EAF1] sm:pl-5">
            {medecin ? (
              <MedecinAvatar
                firstName={medecinFirstName}
                lastName={medecinLastName}
                photoUrl={medecin.photoUrl}
                size="sm"
              />
            ) : (
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[#EAF1FA]" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#010C2D]">{medecinName}</p>
              {medecin && <p className="mt-0.5 truncate text-xs text-[#71809A]">{medecin.specialite}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            {status}
            {questionnaire && (
              <button
                type="button"
                onClick={() => {
                  setShowQuestionnaire((value) => !value)
                  setShowReschedule(false)
                }}
                aria-expanded={showQuestionnaire}
                className="min-h-10 px-2 text-sm font-semibold text-[#007DFF] hover:text-[#005EBF]"
              >
                {showQuestionnaire ? 'Masquer mes réponses' : 'Voir mes réponses'}
              </button>
            )}
            {canNoter && (
              <button
                type="button"
                onClick={() => setShowAvis(true)}
                className="inline-flex min-h-10 items-center gap-1.5 px-2 text-sm font-semibold text-[#8A6100] hover:text-[#6E4D00]"
              >
                <Star className="h-4 w-4" aria-hidden="true" />
                Donner mon avis
              </button>
            )}
            {canReschedule && variant === 'upcoming' && (
              <button
                type="button"
                onClick={toggleReschedule}
                disabled={isReprogramming}
                className="inline-flex min-h-10 items-center gap-1.5 px-2 text-sm font-semibold text-[#007DFF] hover:text-[#005EBF] disabled:opacity-40"
              >
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Changer la date
              </button>
            )}
            {variant === 'upcoming' && renderCancellation()}
            {!questionnaire && !canNoter && !canReschedule && (
              <ChevronRight className="h-4 w-4 text-[#9AA8BA]" aria-hidden="true" />
            )}
          </div>
        </div>

        {renderExpandedPanels()}
      </article>

      {showAvis && medecin && (
        <AvisFormModal
          rdvId={rdv.id}
          medecinId={rdv.medecinId}
          medecinNom={`${medecinFirstName} ${medecinLastName}`.trim()}
          onClose={() => setShowAvis(false)}
          onSuccess={() => setAvisDepose(true)}
        />
      )}
    </li>
  )
}

function Metadata({
  icon: Icon,
  value,
  className = '',
}: {
  icon: typeof CalendarDays
  value: string
  className?: string
}) {
  return (
    <div className={`flex min-w-0 items-start gap-2.5 ${className}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#2D5A9A]" aria-hidden="true" />
      <p className="text-sm leading-5 text-[#52627A]">{value}</p>
    </div>
  )
}
