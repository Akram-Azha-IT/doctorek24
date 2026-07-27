'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { carteFullSchema, CarteFormData } from '@/features/carte/schemas'
import { useCreateCarte } from '@/features/carte/hooks'
import { useUpsertPatientProfile } from '@/features/patient/hooks'
import { getSession, saveSession } from '@/lib/session'

const STEPS = [
  'Identité',
  'Contact',
  'Données médicales',
  'Antécédents',
  'Urgence',
  'Assurance',
]

const GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function CarteSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const session = getSession()
  const createCarte = useCreateCarte()
  const upsertProfile = useUpsertPatientProfile(session?.id ?? '')

  const form = useForm<CarteFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(carteFullSchema) as any,
    defaultValues: {
      photoUrl: null,
      allergies: [],
      maladiesChroniques: [],
      medicamentsActuels: [],
      antecedentsChirurgicaux: [],
      vaccinations: [],
      antecedentsFamiliaux: [],
      contactsUrgence: [],
      donneurOrganes: false,
    },
  })

  const allergies = useFieldArray({ control: form.control, name: 'allergies' as never })
  const maladies = useFieldArray({ control: form.control, name: 'maladiesChroniques' as never })
  const medicaments = useFieldArray({ control: form.control, name: 'medicamentsActuels' })
  const vaccinations = useFieldArray({ control: form.control, name: 'vaccinations' as never })
  const urgences = useFieldArray({ control: form.control, name: 'contactsUrgence' })

  const { register, handleSubmit, watch, setValue } = form
  const photoInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setValue('photoUrl', reader.result as string)
    reader.readAsDataURL(file)
  }

  const onSubmit = async (data: CarteFormData) => {
    if (!session) {
      window.location.assign('/login')
      return
    }
    const {
      dateNaissance, genre, nationalite, numIdentite, photoUrl,
      telephone, adresseRue, adresseVille, adressePays,
      ...carteData
    } = data

    const savedProfile = await upsertProfile.mutateAsync({
      dateNaissance: dateNaissance ?? null,
      genre: genre ?? null,
      nationalite: nationalite ?? null,
      numIdentite: numIdentite ?? null,
      photoUrl: photoUrl ?? null,
      telephone: telephone ?? null,
      adresseRue: adresseRue ?? null,
      adresseVille: adresseVille ?? null,
      adressePays: adressePays ?? null,
    })

    // Backend resolves the patient from the JWT — no patientId in the payload.
    await createCarte.mutateAsync({
      ...carteData,
      allergies: (carteData.allergies ?? []).filter(Boolean) as string[],
      maladiesChroniques: (carteData.maladiesChroniques ?? []).filter(Boolean) as string[],
      vaccinations: (carteData.vaccinations ?? []).filter(Boolean) as string[],
      antecedentsFamiliaux: (carteData.antecedentsFamiliaux ?? []).filter(Boolean) as string[],
    })

    if (savedProfile.photoUrl) {
      saveSession({ ...session, photoUrl: savedProfile.photoUrl })
    }
    router.push('/dashboard/patient')
  }

  const inputCls = 'w-full bg-[#0C4A83]/30 border border-[#356897] rounded-xl px-4 py-2.5 text-white placeholder-[#B6DAF7]/50 focus:outline-none focus:border-[#3DA8FF] text-sm'
  const labelCls = 'block text-xs font-medium text-[#B6DAF7] mb-1'

  return (
    <div className="min-h-screen bg-[#010C2D] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#1863A9]/20 border border-[#1863A9]/30 rounded-full px-4 py-1.5 text-sm text-[#3DA8FF] mb-4">
            <span>Carte Médicale Virtuelle</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Créer votre carte</h1>
          <p className="text-[#B6DAF7] text-sm mt-1">Étape {step + 1} sur {STEPS.length} : {STEPS[step]}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? 'bg-[#1863A9]' : 'bg-[#163C64]'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-[#0D1F3C] border border-[#163C64] rounded-2xl p-6 min-h-[380px]">

            {/* Step 1 — Identity */}
            {step === 0 && (
              <div className="space-y-4">
                {/* Photo upload */}
                <div className="flex flex-col items-center gap-3">
                  <div
                    onClick={() => photoInputRef.current?.click()}
                    className="relative w-24 h-32 rounded-xl border-2 border-dashed border-[#356897] bg-[#0C4A83]/20 overflow-hidden cursor-pointer hover:border-[#3DA8FF] transition-colors flex items-center justify-center"
                  >
                    {watch('photoUrl') ? (
                      // eslint-disable-next-line @next/next/no-img-element -- data URI issu de FileReader, non optimisable par next/image
                      <img src={watch('photoUrl')!} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-[#B6DAF7]/50">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                          <path d="M4 20 C4 15.6 7.6 12 12 12 C16.4 12 20 15.6 20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        </svg>
                        <span className="text-xs text-center leading-tight">Ajouter photo</span>
                      </div>
                    )}
                  </div>
                  {watch('photoUrl') && (
                    <button
                      type="button"
                      onClick={() => { setValue('photoUrl', null); if (photoInputRef.current) photoInputRef.current.value = '' }}
                      className="text-xs text-[#E01E5A] hover:text-white transition-colors"
                    >
                      Supprimer
                    </button>
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <p className="text-[10px] text-[#B6DAF7]/40 text-center">Photo utilisée sur la carte médicale</p>
                </div>

                <div>
                  <label className={labelCls}>Date de naissance</label>
                  <input type="date" {...register('dateNaissance')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Genre</label>
                  <select {...register('genre')} className={inputCls}>
                    <option value="">Sélectionner</option>
                    <option value="HOMME">Homme</option>
                    <option value="FEMME">Femme</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Nationalité</label>
                  <input {...register('nationalite')} placeholder="ex: Marocaine" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>N° identité / Passeport</label>
                  <input {...register('numIdentite')} placeholder="ex: AB123456" className={inputCls} />
                </div>
              </div>
            )}

            {/* Step 2 — Contact */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Téléphone</label>
                  <input {...register('telephone')} placeholder="+212 6XX XXX XXX" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Rue</label>
                  <input {...register('adresseRue')} placeholder="ex: 12 Rue des Roses" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Ville</label>
                    <input {...register('adresseVille')} placeholder="ex: Casablanca" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Pays</label>
                    <input {...register('adressePays')} placeholder="ex: Maroc" className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Medical basics */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Groupe sanguin</label>
                  <select {...register('groupeSanguin')} className={inputCls}>
                    <option value="">Sélectionner</option>
                    {GROUPES_SANGUINS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Taille (cm)</label>
                    <input type="number" {...register('tailleCm')} placeholder="170" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Poids (kg)</label>
                    <input type="number" step="0.1" {...register('poidsKg')} placeholder="70" className={inputCls} />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('donneurOrganes')} className="w-4 h-4 accent-[#1863A9]" />
                  <span className="text-sm text-[#B6DAF7]">Donneur d&apos;organes</span>
                </label>
              </div>
            )}

            {/* Step 4 — Medical history */}
            {step === 3 && (
              <div className="space-y-5">
                <ListField
                  label="Allergies"
                  items={(watch('allergies') ?? []) as string[]}
                  onAdd={() => allergies.append('' as never)}
                  onRemove={(i) => allergies.remove(i)}
                  renderItem={(_, i) => (
                    <input {...register(`allergies.${i}` as never)} placeholder="ex: Pénicilline" className={inputCls} />
                  )}
                />
                <ListField
                  label="Maladies chroniques"
                  items={(watch('maladiesChroniques') ?? []) as string[]}
                  onAdd={() => maladies.append('' as never)}
                  onRemove={(i) => maladies.remove(i)}
                  renderItem={(_, i) => (
                    <input {...register(`maladiesChroniques.${i}` as never)} placeholder="ex: Diabète type 2" className={inputCls} />
                  )}
                />
                <ListField
                  label="Médicaments actuels"
                  items={watch('medicamentsActuels') ?? []}
                  onAdd={() => medicaments.append({ nom: '', dosage: '' })}
                  onRemove={(i) => medicaments.remove(i)}
                  renderItem={(_, i) => (
                    <div className="grid grid-cols-2 gap-2">
                      <input {...register(`medicamentsActuels.${i}.nom`)} placeholder="Nom" className={inputCls} />
                      <input {...register(`medicamentsActuels.${i}.dosage`)} placeholder="Dosage" className={inputCls} />
                    </div>
                  )}
                />
                <ListField
                  label="Vaccinations"
                  items={(watch('vaccinations') ?? []) as string[]}
                  onAdd={() => vaccinations.append('' as never)}
                  onRemove={(i) => vaccinations.remove(i)}
                  renderItem={(_, i) => (
                    <input {...register(`vaccinations.${i}` as never)} placeholder="ex: COVID-19" className={inputCls} />
                  )}
                />
              </div>
            )}

            {/* Step 5 — Emergency */}
            {step === 4 && (
              <div className="space-y-5">
                <ListField
                  label="Contacts d'urgence"
                  items={watch('contactsUrgence') ?? []}
                  onAdd={() => urgences.append({ nom: '', lien: '', telephone: '' })}
                  onRemove={(i) => urgences.remove(i)}
                  renderItem={(_, i) => (
                    <div className="space-y-2">
                      <input {...register(`contactsUrgence.${i}.nom`)} placeholder="Nom" className={inputCls} />
                      <div className="grid grid-cols-2 gap-2">
                        <input {...register(`contactsUrgence.${i}.lien`)} placeholder="Lien (ex: Mère)" className={inputCls} />
                        <input {...register(`contactsUrgence.${i}.telephone`)} placeholder="Téléphone" className={inputCls} />
                      </div>
                    </div>
                  )}
                />
                <div>
                  <label className={labelCls}>Médecin traitant</label>
                  <input {...register('medecinTraitant')} placeholder="Dr. Nom Prénom, contact" className={inputCls} />
                </div>
              </div>
            )}

            {/* Step 6 — Insurance */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Organisme d&apos;assurance</label>
                  <input {...register('assuranceNom')} placeholder="ex: CNOPS, CNSS, AXA" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>N° assuré</label>
                  <input {...register('assuranceNumero')} placeholder="Numéro d'assurance" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Détails supplémentaires</label>
                  <textarea {...register('assuranceDetails')} rows={3} placeholder="Informations complémentaires..." className={inputCls} />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-4">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#163C64] text-[#B6DAF7] border border-[#356897] hover:bg-[#0C4A83] transition-colors"
              >
                Précédent
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#1863A9] text-white hover:bg-[#0C4A83] transition-colors"
              >
                Suivant
              </button>
            ) : (
              <button
                type="submit"
                disabled={createCarte.isPending}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#2EB67D] text-white hover:bg-[#2EB67D]/80 transition-colors disabled:opacity-60"
              >
                {createCarte.isPending ? 'Création...' : 'Créer ma carte'}
              </button>
            )}
          </div>

          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => setStep(STEPS.length - 1)}
              className="w-full mt-2 py-2 text-xs text-[#B6DAF7]/60 hover:text-[#B6DAF7] transition-colors"
            >
              Passer à la fin
            </button>
          )}

          {createCarte.isError && (
            <p className="mt-3 text-center text-sm text-[#E01E5A]">
              Erreur lors de la création. Veuillez réessayer.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

function ListField({
  label,
  items,
  onAdd,
  onRemove,
  renderItem,
}: {
  label: string
  items: unknown[]
  onAdd: () => void
  onRemove: (i: number) => void
  renderItem: (item: unknown, i: number) => React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#B6DAF7] uppercase tracking-widest">{label}</span>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-[#3DA8FF] hover:text-white transition-colors"
        >
          + Ajouter
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1">{renderItem(item, i)}</div>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="mt-2.5 text-[#E01E5A] hover:text-white text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-[#B6DAF7]/40 italic">Aucun élément ajouté</p>
        )}
      </div>
    </div>
  )
}
