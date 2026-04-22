'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
          router.push('/login')
        },
        onError: (err) => {
          const msg = err.message || 'Code invalide ou expiré'
          toast.error(msg)
        },
      }
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-4">
            <svg
              className="w-7 h-7 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Vérifiez votre email</h1>
          {email && (
            <p className="mt-2 text-sm text-gray-500">
              Un code à 6 chiffres a été envoyé à{' '}
              <span className="font-medium text-gray-700">{email}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">Code de vérification</Label>
            <Input
              id="code"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              className="text-center text-xl tracking-[0.4em] font-mono"
              {...register('code')}
              aria-invalid={!!errors.code}
            />
            {errors.code && (
              <p className="text-xs text-red-500">{errors.code.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Vérification...' : 'Valider le code'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Le code expire dans 15 minutes. Vérifiez vos spams si nécessaire.
        </p>
      </div>
    </div>
  )
}

export default function VerificationPage() {
  return (
    <Suspense>
      <VerificationForm />
    </Suspense>
  )
}
