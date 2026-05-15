'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { saveSession } from '@/lib/session'

const LoginSchema = z.object({
  role: z.enum(['MEDECIN', 'PATIENT', 'ADMIN']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
  userId: z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Format UUID invalide (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)',
  ),
})

type LoginValues = z.infer<typeof LoginSchema>

export default function LoginPage() {
  const [role, setRole] = useState<'MEDECIN' | 'PATIENT' | 'ADMIN'>('MEDECIN')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { role: 'MEDECIN', firstName: '', lastName: '', email: '', password: '', userId: '' },
  })

  function onSubmit(values: LoginValues) {
    const pendingRaw = localStorage.getItem('doctorek_pending_name')
    const pending = pendingRaw
      ? (JSON.parse(pendingRaw) as { firstName: string; lastName: string })
      : null
    localStorage.removeItem('doctorek_pending_name')

    saveSession({
      role,
      id: values.userId,
      email: values.email,
      ...(pending ?? {}),
      ...(values.firstName ? { firstName: values.firstName } : {}),
      ...(values.lastName ? { lastName: values.lastName } : {}),
    })

    if (role === 'MEDECIN') {
      router.push('/dashboard/medecin')
    } else if (role === 'PATIENT') {
      router.push(redirect ?? '/dashboard/patient')
    } else {
      router.push('/dashboard/admin')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image src="/logo0.png" alt="Doctorek" width={160} height={54} className="h-12 w-auto mx-auto" priority />
          </Link>
          <p className="mt-2 text-sm text-zinc-500">Connectez-vous a votre espace</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          {/* Role toggle */}
          <div className="mb-6 flex rounded-xl bg-zinc-100 p-1">
            {(['MEDECIN', 'PATIENT', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={[
                  'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
                  role === r
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700',
                ].join(' ')}
              >
                {r === 'MEDECIN' ? 'Médecin' : r === 'PATIENT' ? 'Patient' : 'Admin'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('role')} value={role} />

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="vous@exemple.com"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                {role === 'MEDECIN' ? 'Identifiant médecin (UUID)' : role === 'PATIENT' ? 'Identifiant patient (UUID)' : 'Identifiant admin (UUID)'}
              </label>
              <input
                type="text"
                {...register('userId')}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.userId && (
                <p className="mt-1 text-xs text-red-500">{errors.userId.message}</p>
              )}
              <p className="mt-1 text-xs text-zinc-400">
                Entrez votre UUID fourni lors de l&apos;inscription
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 mt-2"
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Pas encore de compte ?{' '}
            <Link
              href="/inscription"
              className="font-medium text-blue-600 hover:underline"
            >
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
