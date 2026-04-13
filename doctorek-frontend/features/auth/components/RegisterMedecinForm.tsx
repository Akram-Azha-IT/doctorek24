'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RegisterMedecinSchema, type RegisterMedecinFormValues } from '../schemas'
import { useRegisterMedecin } from '../hooks'

export function RegisterMedecinForm() {
  const router = useRouter()
  const { mutate, isPending } = useRegisterMedecin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterMedecinFormValues>({
    resolver: zodResolver(RegisterMedecinSchema),
  })

  function onSubmit(values: RegisterMedecinFormValues) {
    const { confirmPassword: _, ...payload } = values
    mutate(payload, {
      onSuccess: () => {
        toast.success('Inscription réussie ! Bienvenue Dr. sur Doctorek.')
        router.push('/recherche')
      },
      onError: (err) => {
        toast.error(err.message || "Erreur lors de l'inscription")
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Prénom" id="med-firstName" error={errors.firstName?.message}>
          <Input id="med-firstName" {...register('firstName')} aria-invalid={!!errors.firstName} />
        </Field>
        <Field label="Nom" id="med-lastName" error={errors.lastName?.message}>
          <Input id="med-lastName" {...register('lastName')} aria-invalid={!!errors.lastName} />
        </Field>
      </div>

      <Field label="Email professionnel" id="med-email" error={errors.email?.message}>
        <Input id="med-email" type="email" {...register('email')} aria-invalid={!!errors.email} />
      </Field>

      <Field label="Téléphone" id="med-phone" error={errors.phone?.message}>
        <Input
          id="med-phone"
          type="tel"
          placeholder="0612345678"
          {...register('phone')}
          aria-invalid={!!errors.phone}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="INPE" id="med-inpe" error={errors.inpe?.message}>
          <Input
            id="med-inpe"
            placeholder="10 chiffres"
            maxLength={10}
            {...register('inpe')}
            aria-invalid={!!errors.inpe}
          />
        </Field>
        <Field label="Spécialité" id="med-specialite" error={errors.specialite?.message}>
          <Input
            id="med-specialite"
            placeholder="ex: Cardiologue"
            {...register('specialite')}
            aria-invalid={!!errors.specialite}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Ville" id="med-ville" error={errors.ville?.message}>
          <Input
            id="med-ville"
            placeholder="ex: Alger"
            {...register('ville')}
            aria-invalid={!!errors.ville}
          />
        </Field>
        <Field label="Adresse (optionnel)" id="med-adresse" error={errors.adresse?.message}>
          <Input
            id="med-adresse"
            placeholder="ex: 12 rue Didouche Mourad"
            {...register('adresse')}
            aria-invalid={!!errors.adresse}
          />
        </Field>
      </div>

      <Field label="Mot de passe" id="med-password" error={errors.password?.message}>
        <Input
          id="med-password"
          type="password"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
      </Field>

      <Field
        label="Confirmer le mot de passe"
        id="med-confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="med-confirmPassword"
          type="password"
          {...register('confirmPassword')}
          aria-invalid={!!errors.confirmPassword}
        />
      </Field>

      <Button type="submit" disabled={isPending} className="w-full mt-1">
        {isPending ? 'Inscription en cours...' : "S'inscrire en tant que médecin"}
      </Button>
    </form>
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
