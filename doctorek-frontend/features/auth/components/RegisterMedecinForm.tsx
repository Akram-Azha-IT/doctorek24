'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AuthField, Icons, PrimaryButton } from './AuthField'
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
    const { confirmPassword, ...payload } = values
    void confirmPassword // validé côté client, jamais envoyé au serveur
    mutate(payload, {
      onSuccess: (data) => {
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
          placeholder="Dr. Karim"
          leadingIcon={Icons.user}
          error={errors.firstName?.message}
          required
          aria-required="true"
          {...register('firstName')}
        />
        <AuthField
          label="Nom *"
          autoComplete="family-name"
          placeholder="Tazi"
          leadingIcon={Icons.user}
          error={errors.lastName?.message}
          required
          aria-required="true"
          {...register('lastName')}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <AuthField
          label="Email professionnel *"
          type="email"
          autoComplete="email"
          placeholder="cabinet@exemple.ma"
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
          label="INPE *"
          placeholder="10 chiffres"
          maxLength={10}
          inputMode="numeric"
          autoComplete="off"
          leadingIcon={Icons.id}
          hint="Identifiant national professionnel"
          error={errors.inpe?.message}
          required
          aria-required="true"
          {...register('inpe')}
        />
        <AuthField
          label="Spécialité *"
          placeholder="Cardiologue"
          leadingIcon={Icons.stethoscope}
          error={errors.specialite?.message}
          required
          aria-required="true"
          {...register('specialite')}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <AuthField
          label="Ville *"
          placeholder="Casablanca"
          leadingIcon={Icons.pin}
          error={errors.ville?.message}
          required
          aria-required="true"
          {...register('ville')}
        />
        <AuthField
          label="Adresse"
          placeholder="12, av. Mohammed V (optionnel)"
          leadingIcon={Icons.pin}
          error={errors.adresse?.message}
          {...register('adresse')}
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

      <PrimaryButton type="submit" loading={isPending}>
        {isPending ? 'Inscription…' : 'Créer mon compte médecin'}
      </PrimaryButton>
    </form>
  )
}
