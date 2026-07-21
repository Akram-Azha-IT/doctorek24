import { z } from 'zod'

const contactUrgenceSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  lien: z.string().min(1, 'Lien requis'),
  telephone: z.string().min(1, 'Téléphone requis'),
})

const medicamentSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  dosage: z.string().min(1, 'Dosage requis'),
})

const antecedentSchema = z.object({
  description: z.string().min(1, 'Description requise'),
  date: z.string().optional(),
})

export const carteStep1Schema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  dateNaissance: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  nationalite: z.string().optional().nullable(),
  numIdentite: z.string().optional().nullable(),
})

export const carteStep2Schema = z.object({
  telephone: z.string().optional().nullable(),
  adresseRue: z.string().optional().nullable(),
  adresseVille: z.string().optional().nullable(),
  adressePays: z.string().optional().nullable(),
})

export const carteStep3Schema = z.object({
  groupeSanguin: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']).optional().nullable(),
  tailleCm: z.coerce.number().optional().nullable(),
  poidsKg: z.coerce.number().optional().nullable(),
  donneurOrganes: z.boolean().optional(),
})

export const carteStep4Schema = z.object({
  allergies: z.array(z.string()).optional(),
  maladiesChroniques: z.array(z.string()).optional(),
  medicamentsActuels: z.array(medicamentSchema).optional(),
  antecedentsChirurgicaux: z.array(antecedentSchema).optional(),
  vaccinations: z.array(z.string()).optional(),
  antecedentsFamiliaux: z.array(z.string()).optional(),
})

export const carteStep5Schema = z.object({
  contactsUrgence: z.array(contactUrgenceSchema).optional(),
  medecinTraitant: z.string().optional().nullable(),
})

export const carteStep6Schema = z.object({
  assuranceNom: z.string().optional().nullable(),
  assuranceNumero: z.string().optional().nullable(),
  assuranceDetails: z.string().optional().nullable(),
})

export const carteFullSchema = carteStep1Schema
  .extend(carteStep2Schema.shape)
  .extend(carteStep3Schema.shape)
  .extend(carteStep4Schema.shape)
  .extend(carteStep5Schema.shape)
  .extend(carteStep6Schema.shape)

export type CarteFormData = z.infer<typeof carteFullSchema>
