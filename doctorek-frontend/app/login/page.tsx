'use client'

import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/lib/auth'
import { AuthShell } from '@/features/auth/components/AuthShell'
import { Header } from '@/components/Header'
import {
  AuthField,
  Icons,
  PrimaryButton,
} from '@/features/auth/components/AuthField'

const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type LoginValues = z.infer<typeof LoginSchema>

function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const [sessionExpired, setSessionExpired] = useState(false)
  useEffect(() => {
    setSessionExpired(searchParams.get('redirect') !== null)
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginValues) {
    setServerError(null)
    try {
      const { session } = await login(values.email, values.password)
      localStorage.removeItem('doctorek_pending_name')

      if (redirect) {
        router.push(decodeURIComponent(redirect))
      } else if (session.role === 'MEDECIN') {
        router.push('/dashboard/medecin')
      } else if (session.role === 'PATIENT') {
        router.push('/dashboard/patient')
      } else {
        router.push('/dashboard/admin')
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Erreur de connexion')
    }
  }

  return (
    <AuthShell
      eyebrow="Espace patient & médecin"
      headline={
        <>
          Bienvenue sur{' '}
          <span className="text-[#007DFF]">Doctorek</span>
        </>
      }
      description="Votre santé, centralisée. Gérez vos rendez-vous, consultez votre dossier et restez connecté à votre médecin."
      bullets={['Données chiffrées', 'Plateforme Marocaine', 'Disponible 24/7']}
      rightTitle=""
      rightSubtitle=""
    >
      {sessionExpired && (
        <p className="mb-2 rounded-lg bg-[#FFF3CD] px-3 py-2 text-sm text-[#856404]">
          Votre session a expiré. Veuillez vous reconnecter.
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2.5">
        <AuthField
          label="Adresse e-mail"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          leadingIcon={Icons.mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthField
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          leadingIcon={Icons.lock}
          error={errors.password?.message}
          {...register('password')}
        />

        {serverError && (
          <p className="rounded-lg bg-[#FFDEDE] px-3 py-2 text-sm text-[#E01E5A]">
            {serverError}
          </p>
        )}

        <PrimaryButton type="submit" loading={isSubmitting}>
          {isSubmitting ? 'Connexion en cours…' : 'Accéder à mon espace'}
        </PrimaryButton>

        <div className="relative flex items-center gap-3">
          <span className="h-px flex-1 bg-[#EBF4FF]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#465058]/50">
            nouveau sur Doctorek ?
          </span>
          <span className="h-px flex-1 bg-[#EBF4FF]" />
        </div>

        <p className="text-center text-sm text-[#465058]">
          <Link
            href="/inscription"
            className="font-semibold text-[#007DFF] underline-offset-4 hover:underline"
          >
            Créer un compte gratuitement →
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 grid place-items-center bg-[#F0F2F5]">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#007DFF]/30 border-t-[#007DFF]" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </>
  )
}
