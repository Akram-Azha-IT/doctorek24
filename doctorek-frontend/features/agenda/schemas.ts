import { z } from 'zod'

export const PrendreRdvSchema = z.object({
  patientId: z
    .string()
    .uuid("L'identifiant patient doit être un UUID valide")
    .min(1, 'Identifiant patient requis'),
  questionnaire: z.object({
    typeConsultation: z.enum(['CONSULTATION', 'URGENCE']),
    message: z.string().min(1, 'Message requis').max(500, '500 caractères maximum'),
  }),
})

export type PrendreRdvFormValues = z.infer<typeof PrendreRdvSchema>
