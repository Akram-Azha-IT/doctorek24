'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useDefineDisponibilite } from '../hooks'
import type { Disponibilite } from '@/lib/types'

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

interface DisponibiliteFormProps {
  medecinId: string
  selectedDay: string
  dayLabel: string
  existing: Disponibilite | undefined
  onSaved: () => void
  onCancel: () => void
}

const DUREE_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120]

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
      await mutateAsync({ jourSemaine: selectedDay, ...values })
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
