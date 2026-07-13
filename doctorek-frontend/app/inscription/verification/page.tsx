'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { AuthField, PrimaryButton } from '@/features/auth/components/AuthField'
import { useVerifyEmail } from '@/features/auth/hooks'

const VerifyEmailSchema = z.object({
  code: z
    .string()
    .length(6, 'Le code doit contenir exactement 6 chiffres')
    .regex(/^\d{6}$/, 'Le code doit être composé de 6 chiffres'),
})

type VerifyEmailFormValues = z.infer<typeof VerifyEmailSchema>

function VerificationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId') ?? ''
  const email = searchParams.get('email') ?? ''

  const { mutate, isPending } = useVerifyEmail()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(VerifyEmailSchema),
  })

  function onSubmit(values: VerifyEmailFormValues) {
    mutate(
      { userId, code: values.code },
      {
        onSuccess: () => {
          toast.success('Email vérifié ! Vous pouvez maintenant vous connecter.')
          window.location.assign('/login')
        },
        onError: (err) => {
          toast.error(err.message || 'Code invalide ou expiré')
        },
      },
    )
  }

  return (
    <AuthShell
      eyebrow="Vérification"
      headline={
        <>
          Vérifiez votre{' '}
          <span className="text-[#007DFF]">email</span>
        </>
      }
      description="Nous avons envoyé un code à 6 chiffres pour confirmer que cette adresse email est bien à vous. Le code reste valable 15 minutes."
      bullets={['Code chiffré', 'Valide 15 min', 'Sécurisé end-to-end']}
      rightTitle="Vérifiez votre email"
      rightSubtitle={
        email
          ? `Code envoyé à ${email}`
          : 'Saisissez le code reçu par email.'
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <AuthField
          label="Code de vérification"
          inputMode="numeric"
          maxLength={6}
          placeholder="• • • • • •"
          className="text-center text-2xl font-bold tracking-[0.6em] font-mono text-[#010C2D]"
          error={errors.code?.message}
          {...register('code')}
        />

        <PrimaryButton type="submit" loading={isPending}>
          {isPending ? 'Vérification…' : 'Valider le code'}
        </PrimaryButton>

        <div className="rounded-xl bg-[#DFEFFE]/50 px-4 py-3 ring-1 ring-[#B6DAF7]/50">
          <p className="text-xs leading-relaxed text-[#1863A9]">
            <span className="font-semibold">Pas reçu ?</span> Vérifiez vos spams.
            Le code expire dans 15 minutes. Vous pouvez recommencer l’inscription si besoin.
          </p>
        </div>

        <p className="text-center text-sm text-[#465058]">
          Mauvaise adresse ?{' '}
          <Link
            href="/inscription"
            className="font-semibold text-[#007DFF] underline-offset-4 hover:underline"
          >
            Recommencer →
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-[#F0F2F5]">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#007DFF]/30 border-t-[#007DFF]" />
        </div>
      }
    >
      <VerificationForm />
    </Suspense>
  )
}
