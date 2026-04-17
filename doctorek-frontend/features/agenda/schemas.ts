import { z } from 'zod'

export const PrendreRdvSchema = z.object({
  patientId: z
    .string()
    .uuid("L'identifiant patient doit être un UUID valide")
    .min(1, 'Identifiant patient requis'),
  questionnaire: z.object({
    motif: z.string().min(1, 'Motif requis').max(255, '255 caractères maximum'),
    premierConsultation: z.boolean(),
    dureeSymptoomes: z.enum(['moins_7j', '1_4sem', 'plus_1mois']).nullable().optional(),
    intensiteDouleur: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
      .nullable()
      .optional(),
    notesComplementaires: z.string().max(500).optional(),
  }),
})

export type PrendreRdvFormValues = z.infer<typeof PrendreRdvSchema>
