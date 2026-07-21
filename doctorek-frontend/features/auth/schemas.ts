import { z } from 'zod'

const baseFields = {
  firstName: z.string().min(2, 'Prénom requis (min 2 caractères)'),
  lastName: z.string().min(2, 'Nom requis (min 2 caractères)'),
  email: z.email('Email invalide'),
  phone: z.string().regex(/^(\+213|0)[5-7]\d{8}$/, 'Numéro algérien invalide (ex: 0612345678)'),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  confirmPassword: z.string(),
}

export const RegisterSchema = z
  .object(baseFields)
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof RegisterSchema>

export const RegisterMedecinSchema = z
  .object({
    ...baseFields,
    inpe: z.string().regex(/^\d{10}$/, "L'INPE doit contenir exactement 10 chiffres"),
    specialite: z.string().min(2, 'Spécialité requise'),
    ville: z.string().min(2, 'Ville requise'),
    adresse: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type RegisterMedecinFormValues = z.infer<typeof RegisterMedecinSchema>
