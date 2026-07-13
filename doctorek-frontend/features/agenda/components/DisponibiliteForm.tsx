'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useDefineDisponibilite } from '../hooks'
import type { Disponibilite } from '@/lib/types'
import { toLocalISODate } from '@/lib/date'

const Schema = z
  .object({
    heureDebut: z.string(),
    heureFin: z.string(),
    dureeConsultation: z.number().int().min(10).max(120),
  })
  .refine((v) => v.heureFin > v.heureDebut, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ['heureFin'],
  })

type FormValues = z.infer<typeof Schema>
type RepetitionType = 'weekly' | 'custom' | 'once'

interface DisponibiliteFormProps {
  medecinId: string
  selectedDay: string
  dayLabel: string
  existing: Disponibilite | undefined
  onSaved: () => void
  onCancel: () => void
}

const DUREE_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120]

function toISODate(d: Date): string {
  return toLocalISODate(d)
}

function todayISO(): string {
  return toISODate(new Date())
}

function monthsFromNowISO(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + n)
  return toISODate(d)
}

function buildDefaults(existing: Disponibilite | undefined): FormValues {
  if (existing) {
    return {
      heureDebut: existing.heureDebut,
      heureFin: existing.heureFin,
      dureeConsultation: existing.dureeConsultation,
    }
  }
  return { heureDebut: '09:00', heureFin: '17:00', dureeConsultation: 30 }
}

export function DisponibiliteForm({
  medecinId,
  selectedDay,
  dayLabel,
  existing,
  onSaved,
  onCancel,
}: DisponibiliteFormProps) {
  const [repetition, setRepetition] = useState<RepetitionType>('weekly')
  const [interval, setInterval] = useState(2)
  const [startDate, setStartDate] = useState(todayISO)
  const [endType, setEndType] = useState<'jamais' | 'date'>('jamais')
  const [endDate, setEndDate] = useState(monthsFromNowISO(3))

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: buildDefaults(existing),
  })

  useEffect(() => {
    reset(buildDefaults(existing))
  }, [selectedDay, existing, reset])

  const { mutateAsync, isPending } = useDefineDisponibilite(medecinId)

  async function onSubmit(values: FormValues) {
    try {
      const frequence =
        repetition === 'once'
          ? 'UNE_SEULE_FOIS'
          : repetition === 'custom'
            ? 'PERSONNALISE'
            : 'TOUTES_LES_SEMAINES'

      const intervalSemaines = repetition === 'custom' ? interval : 1
      const dateDebut = repetition === 'once' ? startDate : repetition === 'custom' ? startDate : todayISO()
      const typeFinRecurrence =
        repetition === 'custom' && endType === 'date' ? 'DATE' : 'JAMAIS'
      const dateFin =
        repetition === 'custom' && endType === 'date' ? endDate : null

      await mutateAsync({
        jourSemaine: selectedDay,
        ...values,
        frequence,
        intervalSemaines,
        dateDebut,
        typeFinRecurrence,
        dateFin,
      })
      toast.success(`Disponibilité du ${dayLabel} enregistrée`)
      onSaved()
    } catch {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Time range */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="time"
            {...register('heureDebut')}
            className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">–</span>
        <div className="flex-1">
          <input
            type="time"
            {...register('heureFin')}
            className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {errors.heureFin && (
        <p className="text-xs text-red-500">{errors.heureFin.message}</p>
      )}

      {/* Duration */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 shrink-0 w-20">Durée / rdv</label>
        <select
          {...register('dureeConsultation', { valueAsNumber: true })}
          className="flex-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {DUREE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt} min
            </option>
          ))}
        </select>
      </div>

      {/* Repetition toggle */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Répétition
        </p>
        <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
          {(
            [
              { key: 'weekly', label: 'Chaque sem.' },
              { key: 'custom', label: 'Personnalisé' },
              { key: 'once',   label: 'Une fois' },
            ] as { key: RepetitionType; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRepetition(key)}
              className={`flex-1 py-1.5 font-medium transition-colors border-r last:border-r-0 border-gray-200 ${
                repetition === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom recurrence config */}
      {repetition === 'custom' && (
        <div className="rounded-md bg-gray-50 border border-gray-100 px-3 py-2.5 space-y-2.5">
          {/* Interval */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 shrink-0">Toutes les</span>
            <input
              type="number"
              min={1}
              max={52}
              value={interval}
              onChange={(e) =>
                setInterval(Math.max(1, Math.min(52, Number(e.target.value))))
              }
              className="w-14 rounded border border-gray-200 px-2 py-1 text-center text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600">semaine{interval > 1 ? 's' : ''}</span>
          </div>

          {/* Start date */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 shrink-0 w-12">Début</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End condition */}
          <div className="space-y-1.5">
            <span className="text-xs text-gray-600">Se termine</span>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={endType === 'jamais'}
                  onChange={() => setEndType('jamais')}
                  className="accent-blue-600"
                />
                <span className="text-xs text-gray-700">Jamais</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={endType === 'date'}
                  onChange={() => setEndType('date')}
                  className="accent-blue-600"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndType('date'); setEndDate(e.target.value) }}
                  className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* One-time date picker */}
      {repetition === 'once' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 shrink-0 w-12">Date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? '...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
