'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AuthField, Icons, PrimaryButton } from './AuthField'
import { RegisterSchema, type RegisterFormValues } from '../schemas'
import { useRegisterPatient } from '../hooks'
import { omit } from '@/lib/object'

export function RegisterForm() {
  const router = useRouter()
  const { mutate, isPending } = useRegisterPatient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
  })

  function onSubmit(values: RegisterFormValues) {
    // confirmPassword est validé côté client, jamais transmis au serveur.
    const payload = omit(values, 'confirmPassword')
    mutate(payload, {
      onSuccess: (data) => {
        localStorage.setItem(
          'doctorek_pending_name',
          JSON.stringify({
            firstName: values.firstName,
            lastName: values.lastName,
          }),
        )
        toast.success('Inscription réussie ! Vérifiez votre email.')
        router.push(
          `/inscription/verification?userId=${data.id}&email=${encodeURIComponent(data.email)}`,
        )
      },
      onError: (err) => {
        toast.error(err.message || "Erreur lors de l'inscription")
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2" noValidate>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <AuthField
          label="Prénom *"
          autoComplete="given-name"
          placeholder="Aïcha"
          leadingIcon={Icons.user}
          error={errors.firstName?.message}
          required
          aria-required="true"
          {...register('firstName')}
        />
        <AuthField
          label="Nom *"
          autoComplete="family-name"
          placeholder="Bennani"
          leadingIcon={Icons.user}
          error={errors.lastName?.message}
          required
          aria-required="true"
          {...register('lastName')}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <AuthField
          label="Email *"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          leadingIcon={Icons.mail}
          error={errors.email?.message}
          required
          aria-required="true"
          {...register('email')}
        />
        <AuthField
          label="Téléphone *"
          type="tel"
          autoComplete="tel"
          placeholder="0612345678"
          leadingIcon={Icons.phone}
          error={errors.phone?.message}
          required
          aria-required="true"
          {...register('phone')}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <AuthField
          label="Mot de passe *"
          type="password"
          autoComplete="new-password"
          placeholder="Au moins 8 caractères"
          leadingIcon={Icons.lock}
          hint="8 caractères minimum"
          error={errors.password?.message}
          required
          aria-required="true"
          {...register('password')}
        />
        <AuthField
          label="Confirmer *"
          type="password"
          autoComplete="new-password"
          placeholder="Retapez votre mot de passe"
          leadingIcon={Icons.lock}
          error={errors.confirmPassword?.message}
          required
          aria-required="true"
          {...register('confirmPassword')}
        />
      </div>

      <div className="mt-1.5">
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-[#F4F6F9] px-3.5 py-3">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#007DFF]"
            aria-invalid={!!errors.consentementDonnees}
            {...register('consentementDonnees')}
          />
          <span className="text-xs leading-relaxed text-[#465058]">
            J&apos;accepte que Doctorek traite mes données personnelles et de santé pour gérer
            mes rendez-vous et mon dossier médical, conformément à la{' '}
            <Link
              href="/confidentialite"
              target="_blank"
              className="font-semibold text-[#1863A9] underline underline-offset-2"
            >
              politique de confidentialité
            </Link>{' '}
            et à la loi 09-08.
          </span>
        </label>
        {errors.consentementDonnees && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-[#B4232A]">
            {errors.consentementDonnees.message}
          </p>
        )}
      </div>

      <PrimaryButton type="submit" loading={isPending}>
        {isPending ? 'Inscription…' : 'Créer mon compte patient'}
      </PrimaryButton>
    </form>
  )
}
