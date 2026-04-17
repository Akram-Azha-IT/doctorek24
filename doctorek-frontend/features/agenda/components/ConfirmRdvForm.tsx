'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PrendreRdvSchema, type PrendreRdvFormValues } from '../schemas'
import { usePrendreRdv } from '../hooks'
import { getSession } from '@/lib/session'
import type { RendezVous } from '@/lib/types'

interface ConfirmRdvFormProps {
  medecinId: string
  medecinName: string
  dateRdv: string   // "YYYY-MM-DD"
  heureRdv: string  // "HH:mm"
  heureFin: string  // "HH:mm"
  onSuccess: (rdv: RendezVous) => void
  onCancel: () => void
}

const DUREE_OPTIONS = [
  { value: 'moins_7j', label: 'Moins de 7 jours' },
  { value: '1_4sem', label: '1 à 4 semaines' },
  { value: 'plus_1mois', label: 'Plus d\'un mois' },
] as const

export function ConfirmRdvForm({
  medecinId,
  medecinName,
  dateRdv,
  heureRdv,
  heureFin,
  onSuccess,
  onCancel,
}: ConfirmRdvFormProps) {
  const { mutate, isPending } = usePrendreRdv(medecinId, dateRdv)
  const [sessionPatientId, setSessionPatientId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<PrendreRdvFormValues>({
    resolver: zodResolver(PrendreRdvSchema),
    defaultValues: {
      questionnaire: {
        premierConsultation: false,
        dureeSymptoomes: null,
        intensiteDouleur: null,
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

  const premierConsultation = watch('questionnaire.premierConsultation')
  const intensiteDouleur = watch('questionnaire.intensiteDouleur')

  function onSubmit(values: PrendreRdvFormValues) {
    mutate(
      {
        medecinId,
        patientId: values.patientId,
        dateRdv,
        heureRdv,
        questionnaire: {
          ...values.questionnaire,
          intensiteDouleur: values.questionnaire.intensiteDouleur ?? undefined,
          dureeSymptoomes: values.questionnaire.dureeSymptoomes ?? undefined,
        },
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

  return (
    <div className="mt-6 border border-zinc-200 rounded-xl bg-white p-6 shadow-sm">
      {/* Récapitulatif */}
      <div className="mb-6 pb-4 border-b border-zinc-100">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
          Récapitulatif
        </p>
        <p className="font-semibold text-zinc-900">{medecinName}</p>
        <p className="text-sm text-zinc-600 mt-0.5">
          {formatDate(dateRdv)} · {heureRdv} – {heureFin}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Patient ID (only if not logged in as patient) */}
        {!sessionPatientId && (
          <Field label="Votre identifiant patient (UUID)" id="patientId" error={errors.patientId?.message}>
            <input
              id="patientId"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              {...register('patientId')}
              aria-invalid={!!errors.patientId}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 aria-[invalid=true]:border-red-400"
            />
            <p className="text-xs text-zinc-400 mt-1">
              Obtenez votre UUID sur votre profil après inscription.
            </p>
          </Field>
        )}

        {/* Section questionnaire */}
        <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-4 flex flex-col gap-5">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Questionnaire pré-consultation
          </p>

          {/* Motif */}
          <Field
            label="Motif de consultation *"
            id="questionnaire.motif"
            error={errors.questionnaire?.motif?.message}
          >
            <textarea
              id="questionnaire.motif"
              rows={3}
              placeholder="Ex : Douleurs abdominales depuis 3 jours…"
              {...register('questionnaire.motif')}
              aria-invalid={!!errors.questionnaire?.motif}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 aria-[invalid=true]:border-red-400"
            />
          </Field>

          {/* Premier rendez-vous */}
          <div className="flex flex-col gap-2">
            <Label>Premier rendez-vous avec ce médecin ?</Label>
            <div className="flex gap-2">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setValue('questionnaire.premierConsultation', val)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    premierConsultation === val
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {val ? 'Oui' : 'Non'}
                </button>
              ))}
            </div>
          </div>

          {/* Durée des symptômes */}
          <div className="flex flex-col gap-2">
            <Label>Durée des symptômes (optionnel)</Label>
            <Controller
              control={control}
              name="questionnaire.dureeSymptoomes"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {DUREE_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(field.value === value ? null : value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        field.value === value
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Intensité de la gêne */}
          <div className="flex flex-col gap-2">
            <Label>Intensité de la gêne (optionnel)</Label>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setValue(
                      'questionnaire.intensiteDouleur',
                      intensiteDouleur === n ? null : n,
                    )
                  }
                  className={`w-9 h-9 rounded-full text-sm font-semibold border transition-colors ${
                    intensiteDouleur === n
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-400">1 = légère · 5 = très intense</p>
          </div>

          {/* Notes complémentaires */}
          <Field
            label="Notes complémentaires (optionnel)"
            id="questionnaire.notesComplementaires"
            error={errors.questionnaire?.notesComplementaires?.message}
          >
            <textarea
              id="questionnaire.notesComplementaires"
              rows={2}
              placeholder="Informations utiles pour le médecin…"
              {...register('questionnaire.notesComplementaires')}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
