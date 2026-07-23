import { z } from 'zod'

export const PrendreRdvSchema = z.object({
  patientId: z.uuid("L'identifiant patient doit être un UUID valide"),
  questionnaire: z.object({
    typeConsultation: z.enum(['CONSULTATION', 'URGENCE']),
    // Optionnel : le patient peut réserver sans détailler son motif (chaîne vide acceptée).
    message: z.string().max(500, '500 caractères maximum'),
  }),
})

export type PrendreRdvFormValues = z.infer<typeof PrendreRdvSchema>
