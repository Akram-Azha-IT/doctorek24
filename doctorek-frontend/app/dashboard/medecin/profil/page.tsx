'use client'

import { useEffect, useRef, useState } from 'react'
import { useRoleGuard } from '@/lib/useRoleGuard'
import { getSession } from '@/lib/session'
import { useMedecin, useUpdateMedecin } from '@/features/annuaire/hooks'
import type { UpdateMedecinProfilePayload } from '@/features/annuaire/api'

const SPECIALITES = [
  'Médecine générale', 'Cardiologie', 'Dermatologie', 'Endocrinologie',
  'Gastro-entérologie', 'Gynécologie', 'Neurologie', 'Oncologie',
  'Ophtalmologie', 'Orthopédie', 'Pédiatrie', 'Pneumologie',
  'Psychiatrie', 'Radiologie', 'Rhumatologie', 'Urologie',
]

const LANGUES = ['Arabe', 'Français', 'Anglais', 'Amazigh', 'Espagnol']

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }

function parseMapUrl(text: string): { lat: number; lng: number } | null {
  const t = text.trim()

  // Google Maps /@lat,lng,zoom or /place/.../@lat,lng
  let m = t.match(/\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  // Google Maps ?q=lat,lng or &q=lat,lng
  m = t.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  // Apple Maps ?ll=lat,lng
  m = t.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  // OpenStreetMap #map=zoom/lat/lng
  m = t.match(/#map=\d+\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  // Bing Maps ?cp=lat~lng
  m = t.match(/[?&]cp=(-?\d+\.?\d*)~(-?\d+\.?\d*)/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  // Plain "lat, lng" or "lat lng"
  m = t.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
  if (m) return { lat: Number(m[1]), lng: Number(m[2]) }

  return null
}

function useGeoDetect(onSuccess: (lat: number, lng: number) => void) {
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' })

  const detect = () => {
    if (!navigator.geolocation) {
      setGeo({ status: 'error', message: 'Géolocalisation non supportée par ce navigateur' })
      return
    }
    setGeo({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ status: 'idle' })
        onSuccess(pos.coords.latitude, pos.coords.longitude)
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Accès à la localisation refusé'
            : 'Impossible de récupérer votre position'
        setGeo({ status: 'error', message })
      },
      { timeout: 10_000, maximumAge: 60_000 },
    )
  }

  return { geo, detect }
}

export default function ProfilPage() {
  useRoleGuard('MEDECIN')

  const session = getSession()
  const medecinId = session?.id ?? ''

  const { data: profile, isLoading: profileLoading } = useMedecin(medecinId)
  const mutation = useUpdateMedecin(medecinId)

  const [form, setForm] = useState<{
    firstName: string
    lastName: string
    phone: string
    specialite: string
    ville: string
    adresse: string
    lang: string
    latitude: number | null
    longitude: number | null
  }>({
    firstName: '',
    lastName: '',
    phone: '',
    specialite: '',
    ville: '',
    adresse: '',
    lang: 'fr',
    latitude: null,
    longitude: null,
  })

  const initialised = useRef(false)
  useEffect(() => {
    if (profile && !initialised.current) {
      initialised.current = true
      setForm({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: '',
        specialite: profile.specialite ?? '',
        ville: profile.ville ?? '',
        adresse: profile.adresse ?? '',
        lang: 'fr',
        latitude: profile.latitude ?? null,
        longitude: profile.longitude ?? null,
      })
    }
  }, [profile])

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const { geo, detect } = useGeoDetect((lat, lng) =>
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng })),
  )

  const clearLocation = () =>
    setForm((prev) => ({ ...prev, latitude: null, longitude: null }))

  const [mapUrl, setMapUrl] = useState('')
  const [mapUrlError, setMapUrlError] = useState('')

  const handleMapUrlPaste = (value: string) => {
    setMapUrl(value)
    setMapUrlError('')
    if (!value.trim()) return
    const coords = parseMapUrl(value)
    if (coords) {
      setForm((prev) => ({ ...prev, latitude: coords.lat, longitude: coords.lng }))
      setMapUrl('')
    } else {
      setMapUrlError('Lien non reconnu. Essayez Google Maps, Apple Maps, ou "lat, lng".')
    }
  }

  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveStatus('idle')
    const payload: UpdateMedecinProfilePayload = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined,
      specialite: form.specialite,
      ville: form.ville,
      adresse: form.adresse || undefined,
      lang: form.lang || undefined,
      latitude: form.latitude,
      longitude: form.longitude,
    }
    mutation.mutate(payload, {
      onSuccess: () => setSaveStatus('success'),
      onError: () => setSaveStatus('error'),
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
    <>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Mon profil</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Informations professionnelles et localisation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Identité ── */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-zinc-800">Informations générales</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Prénom" required>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set('firstName')}
                  required
                  className="input"
                  placeholder="Youssef"
                />
              </Field>
              <Field label="Nom" required>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set('lastName')}
                  required
                  className="input"
                  placeholder="Bakkali"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Spécialité" required>
                <select value={form.specialite} onChange={set('specialite')} required className="input">
                  <option value="" disabled>Choisir…</option>
                  {SPECIALITES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Téléphone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  className="input"
                  placeholder="+212 6 00 00 00 01"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Ville" required>
                <input
                  type="text"
                  value={form.ville}
                  onChange={set('ville')}
                  required
                  className="input"
                  placeholder="Casablanca"
                />
              </Field>
              <Field label="Adresse du cabinet">
                <input
                  type="text"
                  value={form.adresse}
                  onChange={set('adresse')}
                  className="input"
                  placeholder="123 Rue Hassan II"
                />
              </Field>
            </div>

            <Field label="Langue de consultation">
              <select value={form.lang} onChange={set('lang')} className="input">
                <option value="fr">Français</option>
                <option value="ar">Arabe</option>
                <option value="en">Anglais</option>
              </select>
            </Field>
          </section>

          {/* ── Localisation ── */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-800">Localisation</h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Permet aux patients de vous trouver via la recherche par proximité.
                </p>
              </div>
              {form.latitude !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Position enregistrée
                </span>
              )}
            </div>

            {form.latitude !== null && form.longitude !== null ? (
              <div className="flex items-center gap-3 rounded-lg border border-[#B6DAF7] bg-[#DFEFFE] px-4 py-3">
                <svg className="h-5 w-5 shrink-0 text-[#1863A9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <div className="flex-1 text-sm">
                  <span className="font-medium text-zinc-800">
                    {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                  </span>
                  <span className="ml-2 text-zinc-500">· {form.ville || 'Position GPS'}</span>
                </div>
                <button
                  type="button"
                  onClick={clearLocation}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Effacer
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-center">
                <svg className="mx-auto h-8 w-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <p className="mt-2 text-sm text-zinc-500">Aucune position enregistrée</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={detect}
                disabled={geo.status === 'loading'}
                className="inline-flex items-center gap-2 rounded-lg border border-[#1863A9] bg-white px-4 py-2 text-sm font-medium text-[#1863A9] hover:bg-[#DFEFFE] disabled:opacity-50 transition-colors"
              >
                {geo.status === 'loading' ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Détection…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    Détecter ma position
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={form.latitude ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      latitude: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  className="input w-36 text-sm"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="any"
                  value={form.longitude ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      longitude: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  className="input w-36 text-sm"
                  placeholder="Longitude"
                />
              </div>
            </div>

            {geo.status === 'error' && (
              <p className="text-sm text-red-600">{geo.message}</p>
            )}

            {/* ── Paste from map ── */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700">
                Coller un lien de carte
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mapUrl}
                  onChange={(e) => handleMapUrlPaste(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text')
                    handleMapUrlPaste(pasted)
                    e.preventDefault()
                  }}
                  className="input flex-1"
                  placeholder="Google Maps, Apple Maps, OpenStreetMap ou « lat, lng »"
                />
              </div>
              {mapUrlError && (
                <p className="text-xs text-red-500">{mapUrlError}</p>
              )}
              <p className="text-xs text-zinc-400">
                Collez le lien de partage depuis Google Maps, Apple Maps, OpenStreetMap ou Bing Maps.
              </p>
            </div>
          </section>

          {/* ── Actions ── */}
          <div className="flex items-center justify-between">
            <div>
              {saveStatus === 'success' && (
                <span className="flex items-center gap-2 text-sm text-green-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Profil mis à jour
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm text-red-600">Erreur lors de la mise à jour</span>
              )}
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0C4A83] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#064178] disabled:opacity-60 transition-colors"
            >
              {mutation.isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enregistrement…
                </>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </form>
      </main>

      <style jsx>{`
        .input {
          display: block;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e4e4e7;
          background: #fff;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #18181b;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #1863a9;
          box-shadow: 0 0 0 3px rgba(24,99,169,0.1);
        }
        .input::placeholder {
          color: #a1a1aa;
        }
      `}</style>
    </>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
