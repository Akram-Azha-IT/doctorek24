'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useDefineDisponibilite } from '../hooks'
import type { Disponibilite } from '@/lib/types'
import { DAYS } from './WeeklyGrid'

const SlotSchema = z.object({
  enabled: z.boolean(),
  heureDebut: z.string(),
  heureFin: z.string(),
  dureeConsultation: z.number().int().min(10).max(120),
})

const DisponibiliteSchema = z
  .object({
    matin: SlotSchema,
    apremMidi: SlotSchema,
  })
  .superRefine((v, ctx) => {
    if (!v.matin.enabled && !v.apremMidi.enabled) {
      ctx.addIssue({
        code: 'custom',
        message: 'Activez au moins une plage horaire',
        path: ['matin', 'enabled'],
      })
    }
    if (v.matin.enabled && v.matin.heureFin <= v.matin.heureDebut) {
      ctx.addIssue({
        code: 'custom',
        message: "L'heure de fin doit être après l'heure de début",
        path: ['matin', 'heureFin'],
      })
    }
    if (v.apremMidi.enabled && v.apremMidi.heureFin <= v.apremMidi.heureDebut) {
      ctx.addIssue({
        code: 'custom',
        message: "L'heure de fin doit être après l'heure de début",
        path: ['apremMidi', 'heureFin'],
      })
    }
  })

type FormValues = z.infer<typeof DisponibiliteSchema>

interface DisponibiliteFormProps {
  medecinId: string
  selectedDay: string
  existing: Disponibilite[]
  onSaved: () => void
}

const DUREE_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120]

// The backend upserts by (medecinId, jourSemaine) — one record per day.
// We store the full day range (heureDebut → heureFin) and split it visually
// at 12:00 / 13:00 when the record spans both halves.
function buildDefaults(existing: Disponibilite[]): FormValues {
  const record = existing[0]

  if (!record) {
    return {
      matin: { enabled: false, heureDebut: '08:00', heureFin: '12:00', dureeConsultation: 30 },
      apremMidi: { enabled: false, heureDebut: '13:00', heureFin: '18:00', dureeConsultation: 30 },
    }
  }

  const spansAfternoon = record.heureFin > '12:00'

  if (spansAfternoon) {
    return {
      matin: {
        enabled: true,
        heureDebut: record.heureDebut,
        heureFin: '12:00',
        dureeConsultation: record.dureeConsultation,
      },
      apremMidi: {
        enabled: true,
        heureDebut: '13:00',
        heureFin: record.heureFin,
        dureeConsultation: record.dureeConsultation,
      },
    }
  }

  // Morning-only record
  return {
    matin: {
      enabled: true,
      heureDebut: record.heureDebut,
      heureFin: record.heureFin,
      dureeConsultation: record.dureeConsultation,
    },
    apremMidi: { enabled: false, heureDebut: '13:00', heureFin: '18:00', dureeConsultation: record.dureeConsultation },
  }
}

export function DisponibiliteForm({
  medecinId,
  selectedDay,
  existing,
  onSaved,
}: DisponibiliteFormProps) {
  const dayLabel = DAYS.find((d) => d.key === selectedDay)?.label ?? selectedDay

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(DisponibiliteSchema),
    defaultValues: buildDefaults(existing),
  })

  useEffect(() => {
    reset(buildDefaults(existing))
  }, [selectedDay, existing, reset])

  const { mutateAsync, isPending } = useDefineDisponibilite(medecinId)

  const matinEnabled = watch('matin.enabled')
  const apremMidiEnabled = watch('apremMidi.enabled')

  async function onSubmit(values: FormValues) {
    try {
      let heureDebut: string
      let heureFin: string
      let dureeConsultation: number

      if (values.matin.enabled && values.apremMidi.enabled) {
        // Merge both blocks into one record: matin start → apremMidi end
        heureDebut = values.matin.heureDebut
        heureFin = values.apremMidi.heureFin
        dureeConsultation = values.matin.dureeConsultation
      } else if (values.matin.enabled) {
        heureDebut = values.matin.heureDebut
        heureFin = values.matin.heureFin
        dureeConsultation = values.matin.dureeConsultation
      } else {
        heureDebut = values.apremMidi.heureDebut
        heureFin = values.apremMidi.heureFin
        dureeConsultation = values.apremMidi.dureeConsultation
      }

      await mutateAsync({ jourSemaine: selectedDay, heureDebut, heureFin, dureeConsultation })
      toast.success(`Disponibilité du ${dayLabel} enregistrée`)
      onSaved()
    } catch {
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
      <div className="mb-5 flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs text-white font-bold">
          {dayLabel.charAt(0)}
        </span>
        <h3 className="font-semibold text-zinc-900">
          {existing.length > 0 ? `Modifier — ${dayLabel}` : `Configurer — ${dayLabel}`}
        </h3>
        {existing.length > 0 && (
          <span className="ml-auto text-xs text-emerald-600 font-medium">
            Deja configure
          </span>
        )}
      </div>

      {errors.matin?.enabled?.message && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
          {errors.matin.enabled.message}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Matin */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-3">
            <input
              type="checkbox"
              id="matin-enabled"
              {...register('matin.enabled')}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
            <label
              htmlFor="matin-enabled"
              className="cursor-pointer text-sm font-semibold text-zinc-700"
            >
              Matin
            </label>
          </div>

          {matinEnabled && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Debut</label>
                <input
                  type="time"
                  {...register('matin.heureDebut')}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Fin</label>
                <input
                  type="time"
                  {...register('matin.heureFin')}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                {errors.matin?.heureFin && (
                  <p className="mt-1 text-xs text-red-500">{errors.matin.heureFin.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Duree (min)</label>
                <select
                  {...register('matin.dureeConsultation', { valueAsNumber: true })}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {DUREE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt} min
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Apres-midi */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-3">
            <input
              type="checkbox"
              id="aprem-enabled"
              {...register('apremMidi.enabled')}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
            />
            <label
              htmlFor="aprem-enabled"
              className="cursor-pointer text-sm font-semibold text-zinc-700"
            >
              Apres-midi
            </label>
          </div>

          {apremMidiEnabled && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Debut</label>
                <input
                  type="time"
                  {...register('apremMidi.heureDebut')}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Fin</label>
                <input
                  type="time"
                  {...register('apremMidi.heureFin')}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                {errors.apremMidi?.heureFin && (
                  <p className="mt-1 text-xs text-red-500">{errors.apremMidi.heureFin.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Duree (min)</label>
                <select
                  {...register('apremMidi.dureeConsultation', { valueAsNumber: true })}
                  className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {DUREE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt} min
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 sm:w-auto"
        >
          {isPending ? 'Enregistrement...' : `Enregistrer ${dayLabel}`}
        </button>
      </form>
    </div>
  )
}
