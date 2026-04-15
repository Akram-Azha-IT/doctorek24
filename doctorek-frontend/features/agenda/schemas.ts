import { z } from 'zod'

export const PrendreRdvSchema = z.object({
  patientId: z
    .string()
    .uuid("L'identifiant patient doit être un UUID valide")
    .min(1, 'Identifiant patient requis'),
  motif: z.string().max(255, '255 caractères maximum').optional(),
})

export type PrendreRdvFormValues = z.infer<typeof PrendreRdvSchema>
