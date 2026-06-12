'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { carteFullSchema, CarteFormData } from '@/features/carte/schemas'
import { useCreateCarte, useUpdateCarte, useCarteByPatient } from '@/features/carte/hooks'
import { usePatientProfile, useUpsertPatientProfile } from '@/features/patient/hooks'
import { getInfosMedicales, upsertInfosMedicales } from '@/features/dossier/api'
import { getSession, saveSession } from '@/lib/session'
import { CarteVirtuelle, PatientProfile } from '@/lib/types'
import CarteVirtuelleCard from '@/features/carte/components/CarteVirtuelleCard'
import LogoLoader from '@/components/LogoLoader'

const STEPS = [
  { label: 'Identité', icon: '👤', desc: 'Informations personnelles' },
  { label: 'Contact', icon: '📍', desc: 'Adresse & téléphone' },
  { label: 'Données médicales', icon: '🩺', desc: 'Groupe sanguin & morphologie' },
  { label: 'Antécédents', icon: '📋', desc: 'Allergies & traitements' },
  { label: 'Urgence', icon: '🚨', desc: 'Contacts & médecin traitant' },
  { label: 'Assurance', icon: '🏥', desc: 'Organisme & numéro' },
]

const GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function mapToForm(carte: CarteVirtuelle | null, profile: PatientProfile | null): CarteFormData {
  return {
    photoUrl: profile?.photoUrl ?? null,
    dateNaissance: profile?.dateNaissance ?? null,
    genre: profile?.genre ?? null,
    nationalite: profile?.nationalite ?? null,
    numIdentite: profile?.numIdentite ?? null,
    telephone: profile?.telephone ?? null,
    adresseRue: profile?.adresseRue ?? null,
    adresseVille: profile?.adresseVille ?? null,
    adressePays: profile?.adressePays ?? null,
    groupeSanguin: (carte?.groupeSanguin ?? null) as CarteFormData['groupeSanguin'],
    tailleCm: carte?.tailleCm ?? null,
    poidsKg: carte?.poidsKg ?? null,
    donneurOrganes: carte?.donneurOrganes ?? false,
    allergies: carte?.allergies ?? [],
    maladiesChroniques: carte?.maladiesChroniques ?? [],
    medicamentsActuels: carte?.medicamentsActuels ?? [],
    antecedentsChirurgicaux: carte?.antecedentsChirurgicaux ?? [],
    vaccinations: carte?.vaccinations ?? [],
    antecedentsFamiliaux: carte?.antecedentsFamiliaux ?? [],
    contactsUrgence: carte?.contactsUrgence ?? [],
    medecinTraitant: carte?.medecinTraitant ?? null,
    assuranceNom: carte?.assuranceNom ?? null,
    assuranceNumero: carte?.assuranceNumero ?? null,
    assuranceDetails: carte?.assuranceDetails ?? null,
  }
}

export default function CarteEditPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null)

  useEffect(() => {
    setSession(getSession())
  }, [])

  const { data: existingCarte, isLoading } = useCarteByPatient(session?.id ?? null)
  const { data: existingProfile } = usePatientProfile(session?.id ?? null)
  const createCarte = useCreateCarte()
  const updateCarte = useUpdateCarte(session?.id ?? '')
  const upsertProfile = useUpsertPatientProfile(session?.id ?? '')

  const form = useForm<CarteFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(carteFullSchema) as any,
    defaultValues: {
      firstName: null,
      lastName: null,
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

  useEffect(() => {
    if (existingCarte || existingProfile) {
      form.reset({
        ...mapToForm(existingCarte ?? null, existingProfile ?? null),
        firstName: session?.firstName ?? null,
        lastName: session?.lastName ?? null,
      })
    } else if (session) {
      form.setValue('firstName' as never, (session.firstName ?? null) as never)
      form.setValue('lastName' as never, (session.lastName ?? null) as never)
    }
  }, [existingCarte, existingProfile, session, form])

  const allergies = useFieldArray({ control: form.control, name: 'allergies' as never })
  const maladies = useFieldArray({ control: form.control, name: 'maladiesChroniques' as never })
  const medicaments = useFieldArray({ control: form.control, name: 'medicamentsActuels' })
  const antecedents = useFieldArray({ control: form.control, name: 'antecedentsChirurgicaux' })
  const vaccinations = useFieldArray({ control: form.control, name: 'vaccinations' as never })
  const familiaux = useFieldArray({ control: form.control, name: 'antecedentsFamiliaux' as never })
  const urgences = useFieldArray({ control: form.control, name: 'contactsUrgence' })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form
  const photoInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setValue('photoUrl', reader.result as string)
    reader.readAsDataURL(file)
  }

  const isUpdating = !!existingCarte
  const isMutating = isUpdating ? updateCarte.isPending : createCarte.isPending
  const mutateError = isUpdating ? updateCarte.isError : createCarte.isError

  const onSubmit = async (data: CarteFormData) => {
    if (!session) { router.push('/login'); return }
    const {
      firstName, lastName,
      dateNaissance, genre, nationalite, numIdentite, photoUrl,
      telephone, adresseRue, adresseVille, adressePays,
      ...carteData
    } = data as CarteFormData & { firstName?: string | null; lastName?: string | null }

    // Patient profile (identity + contact) → patient_details
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

    // Health card data → cartes_virtuelles
    const cartePayload = {
      ...carteData,
      allergies: (carteData.allergies ?? []).filter(Boolean) as string[],
      maladiesChroniques: (carteData.maladiesChroniques ?? []).filter(Boolean) as string[],
      vaccinations: (carteData.vaccinations ?? []).filter(Boolean) as string[],
      antecedentsFamiliaux: (carteData.antecedentsFamiliaux ?? []).filter(Boolean) as string[],
    }
    if (isUpdating) {
      await updateCarte.mutateAsync(cartePayload)
    } else {
      await createCarte.mutateAsync(cartePayload)
    }

    // Sync overlapping fields to dossier (preserve doctor notes)
    const existingInfos = await getInfosMedicales(session.id).catch(() => null)
    await upsertInfosMedicales(session.id, {
      groupeSanguin: carteData.groupeSanguin ?? null,
      allergies: (carteData.allergies ?? []).filter(Boolean) as string[],
      antecedents: [
        ...(carteData.maladiesChroniques ?? []).filter(Boolean),
        ...(carteData.antecedentsChirurgicaux ?? [])
          .filter((a) => a.description)
          .map((a) => `${a.description}${a.date ? ` (${a.date})` : ''}`),
      ].join('\n') || null,
      traitementsCours: (carteData.medicamentsActuels ?? [])
        .filter((m) => m.nom)
        .map((m) => `${m.nom}${m.dosage ? ` ${m.dosage}` : ''}`.trim())
        .join(', ') || null,
      notesGenerales: existingInfos?.notesGenerales ?? null,
    }).catch(() => null)

    saveSession({
      ...session,
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(savedProfile.photoUrl ? { photoUrl: savedProfile.photoUrl } : {}),
    })
    router.push('/dashboard/patient')
  }

  const inputCls = 'w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-[#333333] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#007DFF]/20 focus:border-[#007DFF] text-sm transition-all'
  const labelCls = 'block text-sm font-medium text-[#4A5568] mb-1.5'
  const errorCls = 'text-xs text-[#E01E5A] mt-1'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full bg-[#F0F2F5]">
        <LogoLoader label="Chargement de votre carte..." />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#F0F2F5] p-6">
      <div className="max-w-5xl mx-auto">

        {/* Carte preview — shown only when carte already exists */}
        {existingCarte && (
          <div className="mb-8">
            <CarteVirtuelleCard
              carte={existingCarte}
              profile={existingProfile}
              firstName={existingCarte.firstName ?? session?.firstName}
              lastName={existingCarte.lastName ?? session?.lastName}
            />
          </div>
        )}

        {/* Motivation banner — shown only for first-time card creation */}
        {!existingCarte && (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-md">
            {/* Top strip — urgency / loss aversion */}
            <div className="bg-[#00263C] px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#E01E5A]/20 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#E01E5A]">
                    <path d="M12 2L2 19h20L12 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 9v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Et si vous étiez inconscient aux urgences ?</p>
                  <p className="text-[#B6DAF7] text-xs mt-0.5">Les secours ont besoin de votre groupe sanguin, allergies et contacts en quelques secondes.</p>
                </div>
              </div>
              <span className="self-start sm:self-auto bg-[#2EB67D] text-white text-[11px] font-bold px-3 py-1 rounded-full flex-shrink-0">
                100% Gratuit
              </span>
            </div>

            {/* Bottom strip — benefits + goal gradient */}
            <div className="bg-[#007DFF] px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5 text-white text-[13px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Prêt en <strong>5 minutes</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-white text-[13px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Reconnu dans tous les établissements</span>
              </div>
              <div className="flex items-center gap-1.5 text-white text-[13px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Téléchargeable en PDF</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-white text-[11px] font-semibold">Service Doctorek certifié</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-6">

          {/* Left sidebar — step list */}
          <div className="hidden lg:flex flex-col w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-4 sticky top-6">
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-4 px-2">
                Étapes
              </p>
              <nav className="space-y-1">
                {STEPS.map((s, i) => {
                  const isActive = i === step
                  const isDone = i < step
                  return (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setStep(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-[#007DFF]/10 border border-[#007DFF]/20'
                          : isDone
                          ? 'hover:bg-[#F8FAFC]'
                          : 'hover:bg-[#F8FAFC] opacity-60'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#007DFF] text-white'
                          : isDone
                          ? 'bg-[#2EB67D] text-white'
                          : 'bg-[#E2E8F0] text-[#94A3B8]'
                      }`}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-[#007DFF]' : isDone ? 'text-[#2EB67D]' : 'text-[#333333]'}`}>
                          {s.label}
                        </p>
                        <p className="text-xs text-[#94A3B8] truncate">{s.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </nav>
              <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                <div className="flex justify-between text-xs text-[#4A5568] mb-1.5">
                  <span>Progression</span>
                  <span className="font-semibold text-[#007DFF]">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] rounded-full h-1.5">
                  <div
                    className="bg-[#007DFF] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main form card */}
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0]">

                {/* Card header */}
                <div className="px-6 py-5 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#007DFF]/10 flex items-center justify-center text-xl">
                      {STEPS[step].icon}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#1A202C]">{STEPS[step].label}</h2>
                      <p className="text-sm text-[#4A5568]">{STEPS[step].desc}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3 py-1">
                      <span className="text-xs text-[#94A3B8]">Étape</span>
                      <span className="text-xs font-bold text-[#007DFF]">{step + 1}/{STEPS.length}</span>
                    </div>
                  </div>

                  {/* Mobile progress bar */}
                  <div className="lg:hidden mt-4">
                    <div className="flex gap-1">
                      {STEPS.map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-1 rounded-full transition-all ${
                            i <= step ? 'bg-[#007DFF]' : 'bg-[#E2E8F0]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step content */}
                <div className="px-6 py-6 min-h-[380px]">

                  {/* Step 1 — Identity */}
                  {step === 0 && (
                    <div className="space-y-5">
                      {/* Name fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Prénom</label>
                          <input {...register('firstName' as never)} placeholder="ex: Mohamed" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Nom</label>
                          <input {...register('lastName' as never)} placeholder="ex: El Fassi" className={inputCls} />
                        </div>
                      </div>

                      {/* Photo upload */}
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <div
                            onClick={() => photoInputRef.current?.click()}
                            className="relative w-24 h-32 rounded-xl border-2 border-dashed border-[#CBD5E0] bg-[#F8FAFC] overflow-hidden cursor-pointer hover:border-[#007DFF] hover:bg-[#007DFF]/5 transition-all flex items-center justify-center group"
                          >
                            {watch('photoUrl') ? (
                              <img src={watch('photoUrl')!} alt="Photo" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 text-[#94A3B8] group-hover:text-[#007DFF] transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                                  <path d="M4 20C4 15.6 7.6 12 12 12s8 3.6 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span className="text-xs text-center leading-tight font-medium">Photo</span>
                              </div>
                            )}
                          </div>
                          {watch('photoUrl') && (
                            <button
                              type="button"
                              onClick={() => { setValue('photoUrl', null); if (photoInputRef.current) photoInputRef.current.value = '' }}
                              className="text-xs text-[#E01E5A] hover:text-[#C01144] transition-colors"
                            >
                              Supprimer
                            </button>
                          )}
                          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-[#333333]">Photo d&apos;identité</p>
                          <p className="text-xs text-[#94A3B8] leading-relaxed">
                            Votre photo sera affichée sur la carte médicale digitale.<br />
                            Format recommandé : portrait, fond neutre.
                          </p>
                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="mt-2 text-xs font-medium text-[#007DFF] hover:text-[#0065D0] transition-colors border border-[#007DFF]/30 rounded-lg px-3 py-1.5 hover:bg-[#007DFF]/5"
                          >
                            Choisir une photo
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <label className={labelCls}>Rue / Adresse</label>
                        <input {...register('adresseRue')} placeholder="ex: 12 Rue des Roses, Appt 3" className={inputCls} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className={labelCls}>Groupe sanguin</label>
                          <select {...register('groupeSanguin')} className={inputCls}>
                            <option value="">Sélectionner</option>
                            {GROUPES_SANGUINS.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Taille (cm)</label>
                          <input type="number" {...register('tailleCm')} placeholder="170" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Poids (kg)</label>
                          <input type="number" step="0.1" {...register('poidsKg')} placeholder="70" className={inputCls} />
                        </div>
                      </div>
                      <div className="bg-[#FFF8F0] border border-[#FFDCAA] rounded-xl p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            {...register('donneurOrganes')}
                            className="w-4 h-4 rounded accent-[#007DFF]"
                          />
                          <div>
                            <p className="text-sm font-medium text-[#333333]">Donneur d&apos;organes</p>
                            <p className="text-xs text-[#94A3B8] mt-0.5">Cochez cette case si vous consentez au don d&apos;organes</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Step 4 — Medical history */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <FormListField
                        label="Allergies"
                        hint="Médicaments, aliments, substances"
                        items={(watch('allergies') ?? []) as string[]}
                        onAdd={() => allergies.append('' as never)}
                        onRemove={(i) => allergies.remove(i)}
                        renderItem={(_, i) => (
                          <input {...register(`allergies.${i}` as never)} placeholder="ex: Pénicilline" className={inputCls} />
                        )}
                      />
                      <FormListField
                        label="Maladies chroniques"
                        hint="Pathologies diagnostiquées"
                        items={(watch('maladiesChroniques') ?? []) as string[]}
                        onAdd={() => maladies.append('' as never)}
                        onRemove={(i) => maladies.remove(i)}
                        renderItem={(_, i) => (
                          <input {...register(`maladiesChroniques.${i}` as never)} placeholder="ex: Diabète type 2" className={inputCls} />
                        )}
                      />
                      <FormListField
                        label="Médicaments actuels"
                        hint="Traitements en cours"
                        items={watch('medicamentsActuels') ?? []}
                        onAdd={() => medicaments.append({ nom: '', dosage: '' })}
                        onRemove={(i) => medicaments.remove(i)}
                        renderItem={(_, i) => (
                          <div className="grid grid-cols-2 gap-2">
                            <input {...register(`medicamentsActuels.${i}.nom`)} placeholder="Nom du médicament" className={inputCls} />
                            <input {...register(`medicamentsActuels.${i}.dosage`)} placeholder="Dosage / posologie" className={inputCls} />
                          </div>
                        )}
                      />
                      <FormListField
                        label="Antécédents chirurgicaux"
                        hint="Opérations & interventions"
                        items={watch('antecedentsChirurgicaux') ?? []}
                        onAdd={() => antecedents.append({ description: '', date: '' })}
                        onRemove={(i) => antecedents.remove(i)}
                        renderItem={(_, i) => (
                          <div className="grid grid-cols-2 gap-2">
                            <input {...register(`antecedentsChirurgicaux.${i}.description`)} placeholder="Description" className={inputCls} />
                            <input type="date" {...register(`antecedentsChirurgicaux.${i}.date`)} className={inputCls} />
                          </div>
                        )}
                      />
                      <FormListField
                        label="Vaccinations"
                        hint="Vaccins reçus"
                        items={(watch('vaccinations') ?? []) as string[]}
                        onAdd={() => vaccinations.append('' as never)}
                        onRemove={(i) => vaccinations.remove(i)}
                        renderItem={(_, i) => (
                          <input {...register(`vaccinations.${i}` as never)} placeholder="ex: COVID-19, Hépatite B" className={inputCls} />
                        )}
                      />
                      <FormListField
                        label="Antécédents familiaux"
                        hint="Maladies héréditaires"
                        items={(watch('antecedentsFamiliaux') ?? []) as string[]}
                        onAdd={() => familiaux.append('' as never)}
                        onRemove={(i) => familiaux.remove(i)}
                        renderItem={(_, i) => (
                          <input {...register(`antecedentsFamiliaux.${i}` as never)} placeholder="ex: Diabète (père)" className={inputCls} />
                        )}
                      />
                    </div>
                  )}

                  {/* Step 5 — Emergency */}
                  {step === 4 && (
                    <div className="space-y-6">
                      <FormListField
                        label="Contacts d'urgence"
                        hint="Personnes à contacter en cas d'urgence"
                        items={watch('contactsUrgence') ?? []}
                        onAdd={() => urgences.append({ nom: '', lien: '', telephone: '' })}
                        onRemove={(i) => urgences.remove(i)}
                        renderItem={(_, i) => (
                          <div className="space-y-2">
                            <input {...register(`contactsUrgence.${i}.nom`)} placeholder="Nom complet" className={inputCls} />
                            <div className="grid grid-cols-2 gap-2">
                              <input {...register(`contactsUrgence.${i}.lien`)} placeholder="Lien (ex: Mère, Conjoint)" className={inputCls} />
                              <input {...register(`contactsUrgence.${i}.telephone`)} placeholder="+212 6XX XXX XXX" className={inputCls} />
                            </div>
                          </div>
                        )}
                      />
                      <div>
                        <label className={labelCls}>Médecin traitant</label>
                        <input {...register('medecinTraitant')} placeholder="Dr. Nom Prénom, cabinet, téléphone" className={inputCls} />
                        <p className="text-xs text-[#94A3B8] mt-1">Coordonnées de votre médecin habituel</p>
                      </div>
                    </div>
                  )}

                  {/* Step 6 — Insurance */}
                  {step === 5 && (
                    <div className="space-y-4">
                      <div className="bg-[#F0F7FF] border border-[#BFDBFE] rounded-xl p-4 mb-2">
                        <p className="text-sm text-[#1E40AF] font-medium">Informations d&apos;assurance maladie</p>
                        <p className="text-xs text-[#3B82F6] mt-1">Ces informations permettent une prise en charge rapide dans les établissements de santé.</p>
                      </div>
                      <div>
                        <label className={labelCls}>Organisme d&apos;assurance</label>
                        <input {...register('assuranceNom')} placeholder="ex: CNOPS, CNSS, RAMED, AXA Assurance" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Numéro d&apos;assuré</label>
                        <input {...register('assuranceNumero')} placeholder="Votre numéro d'immatriculation" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Informations complémentaires</label>
                        <textarea
                          {...register('assuranceDetails')}
                          rows={4}
                          placeholder="Niveau de couverture, mutuelle complémentaire, remarques..."
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card footer — navigation */}
                <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] rounded-b-2xl">
                  <div className="flex items-center gap-3">
                    {step > 0 && (
                      <button
                        type="button"
                        onClick={() => setStep(s => s - 1)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white text-[#4A5568] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E0] transition-all"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Précédent
                      </button>
                    )}
                    <div className="flex-1" />
                    {step < STEPS.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setStep(s => s + 1)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#007DFF] text-white hover:bg-[#0065D0] transition-all"
                      >
                        Suivant
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                    {step === STEPS.length - 1 && (
                      <button
                        type="submit"
                        disabled={isMutating}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#2EB67D] text-white hover:bg-[#25A06C] transition-all disabled:opacity-60"
                      >
                        {isMutating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            {isUpdating ? 'Mise à jour...' : 'Création...'}
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {isUpdating ? 'Enregistrer les modifications' : 'Créer ma carte'}
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {step < STEPS.length - 1 && (
                    <div className="flex justify-center mt-3">
                      <button
                        type="button"
                        onClick={() => setStep(STEPS.length - 1)}
                        className="text-xs text-[#94A3B8] hover:text-[#4A5568] transition-colors"
                      >
                        Aller directement à la dernière étape →
                      </button>
                    </div>
                  )}

                  {mutateError && (
                    <div className="mt-3 bg-[#FFF0F4] border border-[#FECDD3] rounded-lg px-4 py-2.5 flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#E01E5A] flex-shrink-0">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <p className="text-sm text-[#E01E5A]">
                        Une erreur est survenue. Veuillez réessayer.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function FormListField({
  label,
  hint,
  items,
  onAdd,
  onRemove,
  renderItem,
}: {
  label: string
  hint?: string
  items: unknown[]
  onAdd: () => void
  onRemove: (i: number) => void
  renderItem: (item: unknown, i: number) => React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-[#333333]">{label}</p>
          {hint && <p className="text-xs text-[#94A3B8]">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-medium text-[#007DFF] hover:text-[#0065D0] border border-[#007DFF]/30 rounded-lg px-2.5 py-1 hover:bg-[#007DFF]/5 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Ajouter
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start group">
            <div className="flex-1">{renderItem(item, i)}</div>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="mt-2 w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#E01E5A] hover:bg-[#FFF0F4] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="border border-dashed border-[#E2E8F0] rounded-xl p-4 text-center">
            <p className="text-sm text-[#CBD5E0]">Aucun élément — cliquez sur «&nbsp;Ajouter&nbsp;» pour commencer</p>
          </div>
        )}
      </div>
    </div>
  )
}
