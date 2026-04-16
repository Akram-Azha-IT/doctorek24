'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveSession } from '@/lib/session'

const LoginSchema = z.object({
  role: z.enum(['MEDECIN', 'PATIENT']),
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
  userId: z.string().min(1, 'Identifiant requis'),
})

type LoginValues = z.infer<typeof LoginSchema>

export default function LoginPage() {
  const [role, setRole] = useState<'MEDECIN' | 'PATIENT'>('MEDECIN')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { role: 'MEDECIN', email: '', password: '', userId: '' },
  })

  function onSubmit(values: LoginValues) {
    // Use `role` state directly — the hidden input never fires RHF onChange
    saveSession({
      role,
      id: values.userId,
      email: values.email,
    })

    if (role === 'MEDECIN') {
      router.push('/dashboard/medecin')
    } else {
      router.push('/dashboard/patient')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight text-blue-600">
            Doctorek
          </Link>
          <p className="mt-2 text-sm text-zinc-500">Connectez-vous a votre espace</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          {/* Role toggle */}
          <div className="mb-6 flex rounded-xl bg-zinc-100 p-1">
            {(['MEDECIN', 'PATIENT'] as const).map((r) => (
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
                {r === 'MEDECIN' ? 'Medecin' : 'Patient'}
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
                {role === 'MEDECIN' ? 'Identifiant medecin (UUID)' : 'Identifiant patient (UUID)'}
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
