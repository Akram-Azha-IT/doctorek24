'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RegisterSchema, type RegisterFormValues } from '../schemas'
import { useRegisterPatient } from '../hooks'

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
    const { confirmPassword: _, ...payload } = values
    mutate(payload, {
      onSuccess: (data) => {
        localStorage.setItem('doctorek_pending_name', JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
        }))
        toast.success('Inscription réussie ! Vérifiez votre email.')
        router.push(`/inscription/verification?userId=${data.id}&email=${encodeURIComponent(data.email)}`)
      },
      onError: (err) => {
        toast.error(err.message || "Erreur lors de l'inscription")
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Prénom" id="firstName" error={errors.firstName?.message}>
          <Input id="firstName" {...register('firstName')} aria-invalid={!!errors.firstName} />
        </Field>
        <Field label="Nom" id="lastName" error={errors.lastName?.message}>
          <Input id="lastName" {...register('lastName')} aria-invalid={!!errors.lastName} />
        </Field>
      </div>

      <Field label="Email" id="email" error={errors.email?.message}>
        <Input id="email" type="email" {...register('email')} aria-invalid={!!errors.email} />
      </Field>

      <Field label="Téléphone" id="phone" error={errors.phone?.message}>
        <Input
          id="phone"
          type="tel"
          placeholder="0612345678"
          {...register('phone')}
          aria-invalid={!!errors.phone}
        />
      </Field>

      <Field label="Mot de passe" id="password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
      </Field>

      <Field
        label="Confirmer le mot de passe"
        id="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          aria-invalid={!!errors.confirmPassword}
        />
      </Field>

      <Button type="submit" disabled={isPending} className="w-full mt-1">
        {isPending ? 'Inscription en cours...' : "S'inscrire"}
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
