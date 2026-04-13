import { z } from 'zod'

export const SearchSchema = z.object({
  specialite: z.string(),
  ville: z.string(),
})

export type SearchFormValues = z.infer<typeof SearchSchema>
