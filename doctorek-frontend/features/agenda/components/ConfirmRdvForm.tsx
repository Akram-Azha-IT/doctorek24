'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PrendreRdvSchema, type PrendreRdvFormValues } from '../schemas'
import { usePrendreRdv } from '../hooks'
import { getSession } from '@/lib/session'
import type { RendezVous, TypeConsultation } from '@/lib/types'

interface ConfirmRdvFormProps {
  medecinId: string
  medecinName: string
  dateRdv: string   // "YYYY-MM-DD"
  heureRdv: string  // "HH:mm"
  heureFin: string  // "HH:mm"
  onSuccess: (rdv: RendezVous) => void
  onCancel: () => void
  embedded?: boolean
}

const TYPE_OPTIONS: { value: TypeConsultation; label: string }[] = [
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'URGENCE', label: 'Urgence' },
]

export function ConfirmRdvForm({
  medecinId,
  medecinName,
  dateRdv,
  heureRdv,
  heureFin,
  onSuccess,
  onCancel,
  embedded = false,
}: ConfirmRdvFormProps) {
  const { mutate, isPending } = usePrendreRdv(medecinId, dateRdv)
  const [sessionPatientId, setSessionPatientId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PrendreRdvFormValues>({
    resolver: zodResolver(PrendreRdvSchema),
    defaultValues: {
      questionnaire: {
        typeConsultation: 'CONSULTATION',
      },
    },
  })

  useEffect(() => {
    const session = getSession()
    if (session?.role === 'PATIENT' && session.id) {
      setSessionPatientId(session.id)
      setValue('patientId', session.id)
    }
  }, [setValue])

  const typeConsultation = watch('questionnaire.typeConsultation')

  function onSubmit(values: PrendreRdvFormValues) {
    mutate(
      {
        medecinId,
        patientId: values.patientId,
        dateRdv,
        heureRdv,
        motif: values.questionnaire.message,
        questionnaire: values.questionnaire,
      },
      {
        onSuccess: (rdv) => {
          toast.success('Rendez-vous confirmé !')
          onSuccess(rdv)
        },
        onError: (err) => {
          toast.error(err.message || 'Erreur lors de la prise de rendez-vous')
        },
      },
    )
  }

  const inner = (
    <>
      {!embedded && (
        <div className="mb-6 pb-4 border-b border-zinc-100">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
            Récapitulatif
          </p>
          <p className="font-semibold text-zinc-900">{medecinName}</p>
          <p className="text-sm text-zinc-600 mt-0.5">
            {formatDate(dateRdv)} · {heureRdv} – {heureFin}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Require patient session — handled by BookingDrawer / RDV page guard */}
        {!sessionPatientId && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Connectez-vous à votre compte patient pour continuer.
          </div>
        )}

        {/* Section questionnaire */}
        <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-4 flex flex-col gap-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Questionnaire pré-consultation
          </p>

          {/* Type de consultation */}
          <div className="flex flex-col gap-2">
            <Label>Type de consultation</Label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('questionnaire.typeConsultation', value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    typeConsultation === value
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <Field
            label="Message pour le médecin *"
            id="questionnaire.message"
            error={errors.questionnaire?.message?.message}
          >
            <textarea
              id="questionnaire.message"
              rows={3}
              placeholder="Ex : Douleurs abdominales depuis 3 jours…"
              {...register('questionnaire.message')}
              aria-invalid={!!errors.questionnaire?.message}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 aria-[invalid=true]:border-red-400"
            />
          </Field>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-zinc-500 hover:text-zinc-900 px-4 py-2 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors"
          >
            Annuler
          </button>
          <Button type="submit" disabled={isPending} className="flex-1 sm:flex-none">
            {isPending ? 'Confirmation en cours…' : 'Confirmer le rendez-vous'}
          </Button>
        </div>
      </form>
    </>
  )

  if (embedded) return inner

  return (
    <div className="mt-6 border border-zinc-200 rounded-xl bg-white p-6 shadow-sm">
      {inner}
    </div>
  )
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string
  id: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso + 'T00:00:00'))
}
