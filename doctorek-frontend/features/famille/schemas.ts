import { z } from 'zod'

const ROLE_GESTION = ['PARENT', 'TUTEUR', 'AIDANT', 'REPRESENTANT_LEGAL'] as const

export const ProcheSchema = z.object({
  nom: z.string().trim().min(1, 'Nom requis').max(100),
  prenom: z.string().trim().min(1, 'Prénom requis').max(100),
  dateNaissance: z
    .string()
    .min(1, 'Date de naissance requise')
    .refine((d) => !Number.isNaN(Date.parse(d)), 'Date invalide')
    .refine((d) => new Date(d) < new Date(), 'La date doit être dans le passé'),
  lieuNaissance: z.string().max(150).optional(),
  email: z.string().email('Email invalide').or(z.literal('')).optional(),
  telephone: z.string().max(30).optional(),
  role: z.enum(ROLE_GESTION),
  declarationRepresentantLegal: z.literal(true, {
    message: 'Cette déclaration est obligatoire pour gérer un proche',
  }),
})

export type ProcheFormValues = z.infer<typeof ProcheSchema>

export const ROLE_GESTION_LABELS: Record<(typeof ROLE_GESTION)[number], string> = {
  PARENT: 'Parent',
  TUTEUR: 'Tuteur / Tutrice',
  AIDANT: 'Aidant(e)',
  REPRESENTANT_LEGAL: 'Représentant légal',
}
