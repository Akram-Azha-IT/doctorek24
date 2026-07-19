'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Proche, RoleGestion } from '@/lib/types'
import { ProcheSchema, ROLE_GESTION_LABELS, type ProcheFormValues } from '../schemas'

interface ProcheFormProps {
  proche?: Proche          // présent = édition
  isPending: boolean
  onSubmit: (values: ProcheFormValues) => void
  onCancel: () => void
}

const ROLE_OPTIONS = Object.entries(ROLE_GESTION_LABELS) as [RoleGestion, string][]

function computeAge(dateNaissance: string): number | null {
  const birth = new Date(dateNaissance)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  if (beforeBirthday) age -= 1
  return age
}

export function ProcheForm({ proche, isPending, onSubmit, onCancel }: ProcheFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProcheFormValues>({
    resolver: zodResolver(ProcheSchema),
    defaultValues: proche
      ? {
          nom: proche.nom,
          prenom: proche.prenom,
          dateNaissance: proche.dateNaissance ?? '',
          lieuNaissance: proche.lieuNaissance ?? '',
          email: proche.email ?? '',
          telephone: proche.telephone ?? '',
          role: proche.role ?? 'PARENT',
          // Relation existante : la déclaration a déjà été faite à l'ajout
          declarationRepresentantLegal: true,
        }
      : { role: 'PARENT' },
  })

  const dateNaissance = watch('dateNaissance')
  const age = dateNaissance ? computeAge(dateNaissance) : null
  const isMineur = age !== null && age >= 0 && age < 18

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Prénom *" id="prenom" error={errors.prenom?.message}>
          <input id="prenom" {...register('prenom')} className={inputCls(!!errors.prenom)} />
        </Field>
        <Field label="Nom *" id="nom" error={errors.nom?.message}>
          <input id="nom" {...register('nom')} className={inputCls(!!errors.nom)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date de naissance *" id="dateNaissance" error={errors.dateNaissance?.message}>
          <div className="relative">
            <input
              id="dateNaissance"
              type="date"
              {...register('dateNaissance')}
              className={inputCls(!!errors.dateNaissance)}
            />
            {age !== null && age >= 0 && (
              <span
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  isMineur ? 'bg-[#FFDEDE] text-[#E01E5A]' : 'bg-[#DFEFFE] text-[#1863A9]'
                }`}
              >
                {isMineur ? `Mineur · ${age} ans` : `Majeur · ${age} ans`}
              </span>
            )}
          </div>
        </Field>
        <Field label="Lieu de naissance" id="lieuNaissance" error={errors.lieuNaissance?.message}>
          <input id="lieuNaissance" {...register('lieuNaissance')} className={inputCls(false)} />
        </Field>
      </div>

      {/* Coordonnées propres — uniquement pour un proche majeur (règle légale) */}
      {isMineur ? (
        <p className="rounded-lg bg-[#DFEFFE] px-4 py-3 text-sm text-[#064178]">
          Proche mineur : les notifications (confirmations, rappels) vous seront
          envoyées directement. Il n&apos;est pas possible de renseigner ses coordonnées.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Email du proche (optionnel)"
            id="email"
            error={errors.email?.message}
            hint="S'il est renseigné, le proche recevra directement ses notifications."
          >
            <input id="email" type="email" {...register('email')} className={inputCls(!!errors.email)} />
          </Field>
          <Field label="Téléphone (optionnel)" id="telephone" error={errors.telephone?.message}>
            <input id="telephone" {...register('telephone')} className={inputCls(!!errors.telephone)} />
          </Field>
        </div>
      )}

      <Field label="Votre lien avec ce proche *" id="role" error={errors.role?.message}>
        <select id="role" {...register('role')} className={inputCls(!!errors.role)}>
          {ROLE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <label className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 cursor-pointer">
        <input
          type="checkbox"
          {...register('declarationRepresentantLegal')}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#007DFF]"
        />
        <span className="text-sm text-zinc-700">
          Je déclare être le représentant légal de mon proche, ou être autorisé(e) à
          utiliser les services Doctorek pour gérer des données médicales en son nom. *
        </span>
      </label>
      {errors.declarationRepresentantLegal && (
        <p className="-mt-3 text-xs text-red-500">{errors.declarationRepresentantLegal.message}</p>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-[#007DFF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00263C] disabled:opacity-60 sm:flex-none sm:px-6"
        >
          {isPending ? 'Enregistrement…' : proche ? 'Enregistrer' : 'Ajouter le proche'}
        </button>
      </div>
    </form>
  )
}

function inputCls(hasError: boolean): string {
  return `w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007DFF] ${
    hasError ? 'border-red-400' : 'border-zinc-300'
  }`
}

function Field({
  label,
  id,
  error,
  hint,
  children,
}: {
  label: string
  id: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
