'use client'

import { useEffect, useRef, useState } from 'react'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { getSession, saveSession } from '@/lib/session'
import { useMedecin, useUpdateMedecin } from '@/features/annuaire/hooks'
import { updateMedecinPhoto, type UpdateMedecinProfilePayload } from '@/features/annuaire/api'
import { compressImage, parseApiError } from '@/features/medecin/profil/utils'
import { PhotoSection } from '@/features/medecin/profil/components/PhotoSection'
import { GeneralInfoSection } from '@/features/medecin/profil/components/GeneralInfoSection'
import { LocalisationSection } from '@/features/medecin/profil/components/LocalisationSection'
import { SaveActions } from '@/features/medecin/profil/components/SaveActions'
import type { ProfilForm } from '@/features/medecin/profil/types'

export default function ProfilPage() {
  useRoleGuard('MEDECIN')

  const [medecinId, setMedecinId] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoStatus, setPhotoStatus] = useState<'idle' | 'success'>('idle')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState<ProfilForm>({
    firstName: '', lastName: '', phone: '', specialite: '',
    ville: '', adresse: '', lang: 'fr', latitude: null, longitude: null,
  })

  const photoInputRef = useRef<HTMLInputElement>(null)
  const initialised = useRef(false)

  useEffect(() => {
    const s = getSession()
    if (s) { setMedecinId(s.id); setPhotoUrl(s.photoUrl ?? null) }
  }, [])

  const { data: profile, isLoading: profileLoading } = useMedecin(medecinId)
  const mutation = useUpdateMedecin(medecinId)

  useEffect(() => {
    if (profile && !initialised.current) {
      initialised.current = true
      setForm({
        firstName: profile.firstName ?? '', lastName: profile.lastName ?? '',
        phone: '', specialite: profile.specialite ?? '', ville: profile.ville ?? '',
        adresse: profile.adresse ?? '', lang: 'fr',
        latitude: profile.latitude ?? null, longitude: profile.longitude ?? null,
      })
      // Photo persists in the backend (medecin_details.photo_url); the session-only enrichment
      // is wiped on logout, so reload it from the fetched profile and re-seed the session.
      if (profile.photoUrl) {
        setPhotoUrl(profile.photoUrl)
        const s = getSession()
        if (s) {
          saveSession({ ...s, photoUrl: profile.photoUrl })
          window.dispatchEvent(new Event('session-updated'))
        }
      }
    }
  }, [profile])

  const set = (field: keyof ProfilForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || file.size > 2 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = async () => {
      const full = reader.result as string
      setPhotoUrl(full)
      const compressed = await compressImage(full)
      const current = getSession()
      if (current) {
        saveSession({ ...current, photoUrl: compressed })
        window.dispatchEvent(new Event('session-updated'))
        try { await updateMedecinPhoto(current.id, compressed) } catch { /* best-effort */ }
      }
      setPhotoStatus('success')
      setTimeout(() => setPhotoStatus('idle'), 2500)
    }
    reader.readAsDataURL(file)
  }

  function handleRemovePhoto() {
    setPhotoUrl(null)
    const current = getSession()
    if (current) {
      saveSession({ ...current, photoUrl: null })
      window.dispatchEvent(new Event('session-updated'))
    }
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveStatus('idle'); setSaveError(null)
    const payload: UpdateMedecinProfilePayload = {
      firstName: form.firstName, lastName: form.lastName,
      phone: form.phone || undefined, specialite: form.specialite,
      ville: form.ville, adresse: form.adresse || undefined,
      lang: form.lang || undefined, latitude: form.latitude, longitude: form.longitude,
    }
    mutation.mutate(payload, {
      onSuccess: () => setSaveStatus('success'),
      onError: (error) => setSaveError(parseApiError(error)),
    })
  }

  if (profileLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Mon profil</h1>
        <p className="mt-1 text-sm text-zinc-500">Informations professionnelles et localisation.</p>
      </div>

      <PhotoSection
        photoUrl={photoUrl}
        photoStatus={photoStatus}
        firstName={form.firstName}
        lastName={form.lastName}
        photoInputRef={photoInputRef}
        onUploadClick={() => photoInputRef.current?.click()}
        onRemove={handleRemovePhoto}
        onPhotoChange={handlePhotoChange}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <GeneralInfoSection form={form} set={set} />
        <LocalisationSection
          form={form}
          setLatLng={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))}
        />
        <SaveActions
          isPending={mutation.isPending}
          saveStatus={saveStatus}
          saveError={saveError}
        />
      </form>
    </main>
  )
}
