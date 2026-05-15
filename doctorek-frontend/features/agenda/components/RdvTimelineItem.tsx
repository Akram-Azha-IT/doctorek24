'use client'

import { useState } from 'react'
import { useMedecin } from '@/features/annuaire/hooks'
import { MedecinAvatar } from '@/features/annuaire/components/MedecinAvatar'
import { useCreneaux } from '@/features/agenda/hooks'
import type { QuestionnairePreConsult, RendezVous, StatutRdv } from '@/lib/types'

const DUREE_LABELS: Record<string, string> = {
  moins_7j: 'Moins de 7 jours',
  '1_4sem': '1 à 4 semaines',
  plus_1mois: "Plus d'un mois",
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
  return new Date().toISOString().slice(0, 10)
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
    <div className="border-t border-zinc-100 bg-[#F0F2F5] px-5 py-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
        Modifier la date / heure
      </p>

      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">Nouvelle date</label>
        <input
          type="date"
          min={todayISO()}
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setHeure('')
          }}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#007DFF]/30 focus:border-[#007DFF]"
        />
      </div>

      {date && (
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Créneau disponible</label>
          {isLoading ? (
            <p className="text-xs text-zinc-400">Chargement…</p>
          ) : available.length === 0 ? (
            <p className="text-xs text-zinc-400">Aucun créneau disponible ce jour</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map((c) => (
                <button
                  key={c.debut}
                  type="button"
                  onClick={() => setHeure(c.debut)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
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

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={!date || !heure || isPending}
          onClick={() => onSubmit(date, heure)}
          className="rounded-lg bg-[#007DFF] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#00263C] disabled:opacity-40"
        >
          {isPending ? 'Modification…' : 'Confirmer le changement'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-40"
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
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400 mb-3">
        Questionnaire pré-consultation
      </p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        <Row label="Motif" value={q.motif} />
        <Row label="Premier RDV" value={q.premierConsultation ? 'Oui' : 'Non'} />
        {q.dureeSymptoomes && (
          <Row
            label="Durée symptômes"
            value={DUREE_LABELS[q.dureeSymptoomes] ?? q.dureeSymptoomes}
          />
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
  const motif = q?.motif ?? rdv.motif
  const isPast = rdv.statut === 'ANNULE' || rdv.statut === 'TERMINE'

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

            {/* Footer actions */}
            {hasFooter && (
              <div className="flex items-center gap-3 px-4 py-2 border-t border-zinc-50 bg-zinc-50/60">
                {q && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuestionnaire((v) => !v)
                      setShowReschedule(false)
                    }}
                    className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
                    aria-expanded={showQuestionnaire}
                  >
                    {showQuestionnaire ? '↑ Masquer' : '↓ Détails'}
                  </button>
                )}
                {q && canReschedule && (
                  <span className="h-3 w-px bg-zinc-200" />
                )}
                {canReschedule && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowReschedule((v) => !v)
                      setShowQuestionnaire(false)
                    }}
                    disabled={isReprogramming}
                    className="text-[11px] font-semibold text-[#007DFF] hover:text-[#00263C] transition-colors disabled:opacity-40"
                  >
                    Reprogrammer →
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
      </div>
    </li>
  )
}
