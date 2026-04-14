'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PrendreRdvSchema, type PrendreRdvFormValues } from '../schemas'
import { usePrendreRdv } from '../hooks'
import type { RendezVous } from '@/lib/types'

interface ConfirmRdvFormProps {
  medecinId: string
  medecinName: string
  dateRdv: string      // "YYYY-MM-DD"
  heureRdv: string     // "HH:mm"
  heureFin: string     // "HH:mm"
  onSuccess: (rdv: RendezVous) => void
  onCancel: () => void
}

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrendreRdvFormValues>({
    resolver: zodResolver(PrendreRdvSchema),
  })

  function onSubmit(values: PrendreRdvFormValues) {
    mutate(
      {
        medecinId,
        patientId: values.patientId,
        dateRdv,
        heureRdv,
        motif: values.motif ?? undefined,
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

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label="Votre identifiant patient (UUID)" id="patientId" error={errors.patientId?.message}>
          <Input
            id="patientId"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            {...register('patientId')}
            aria-invalid={!!errors.patientId}
            className="font-mono text-sm"
          />
          <p className="text-xs text-zinc-400 mt-1">
            Obtenez votre UUID sur votre profil après inscription.
          </p>
        </Field>

        <Field label="Motif de consultation (optionnel)" id="motif" error={errors.motif?.message}>
          <textarea
            id="motif"
            rows={3}
            placeholder="Ex : Douleurs abdominales depuis 3 jours…"
            {...register('motif')}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900 aria-invalid:border-red-400"
            aria-invalid={!!errors.motif}
          />
        </Field>

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