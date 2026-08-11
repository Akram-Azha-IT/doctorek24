import { z } from 'zod'

export const COMMENTAIRE_MAX = 2000

/**
 * Dépôt d'un avis.
 *
 * La note est obligatoire — un avis sans note ne dit rien ; le commentaire ne l'est pas,
 * beaucoup de patients notent sans vouloir écrire.
 */
export const CreerAvisSchema = z.object({
  note: z
    .number({ message: 'Sélectionnez une note' })
    .int()
    .min(1, 'Sélectionnez une note')
    .max(5, 'La note va de 1 à 5'),
  commentaire: z
    .string()
    .max(COMMENTAIRE_MAX, `Le commentaire ne peut pas dépasser ${COMMENTAIRE_MAX} caractères`)
    .optional(),
  anonyme: z.boolean(),
})

export type CreerAvisInput = z.infer<typeof CreerAvisSchema>
