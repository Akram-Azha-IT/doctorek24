'use client'

import { useState } from 'react'
import { INPUT_CLS } from '../constants'
import { parseMapUrl } from '../utils'
import { useGeoDetect } from '../hooks'
import type { ProfilForm } from '../types'
import LogoLoader from '@/components/LogoLoader'
import { CheckCircle2, ChevronDown, LocateFixed, MapPin } from 'lucide-react'

interface LocalisationSectionProps {
  form: ProfilForm
  setLatLng: (lat: number | null, lng: number | null) => void
}

export function LocalisationSection({ form, setLatLng }: LocalisationSectionProps) {
  const [mapUrl, setMapUrl] = useState('')
  const [mapUrlError, setMapUrlError] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const { geo, detect } = useGeoDetect((lat, lng) => setLatLng(lat, lng))

  const handleMapUrlPaste = (value: string) => {
    setMapUrl(value)
    setMapUrlError('')
    if (!value.trim()) return
    const coords = parseMapUrl(value)
    if (coords) {
      setLatLng(coords.lat, coords.lng)
      setMapUrl('')
    } else {
      setMapUrlError('Lien non reconnu. Essayez Google Maps, Apple Maps, ou "lat, lng".')
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[#DCE3ED] bg-white p-5 shadow-[0_2px_10px_rgba(15,39,73,0.05)] sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF6FF] text-[#007DFF]">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[#101A38]">Localisation du cabinet</h2>
      </div>

      {form.latitude !== null && form.longitude !== null ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#CDEEDF] bg-[#F2FCF7] px-4 py-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1DBF73]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#1AA467]">Position enregistrée</p>
            <p className="mt-1 text-sm text-[#66738F]">
              {form.ville || 'Position GPS'}
              <span className="mx-2">•</span>
              {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#CAD4E1] bg-[#F8FAFC] px-4 py-5 text-center">
          <MapPin className="mx-auto h-7 w-7 text-[#A0AEC0]" aria-hidden="true" />
          <p className="mt-2 text-sm text-[#66738F]">Aucune position enregistrée</p>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={detect}
          disabled={geo.status === 'loading'}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#007DFF] bg-white px-4 text-sm font-semibold text-[#007DFF] transition-colors hover:bg-[#F0F7FF] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007DFF]/15"
        >
          {geo.status === 'loading' ? (
            <>
              <LogoLoader variant="mark" size={16} decorative />
              Détection…
            </>
          ) : (
            <>
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
              Détecter ma position
            </>
          )}
        </button>

      </div>

      {geo.status === 'error' && (
        <p className="text-sm text-red-600">{geo.message}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-[#DCE3ED]">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          aria-expanded={advancedOpen}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#007DFF]/10"
        >
          <span>
            <span className="block text-sm font-semibold text-[#35415D]">Options avancées</span>
            <span className="mt-1 block text-xs text-[#8290A8]">Coller un lien de carte ou saisir les coordonnées manuellement.</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-[#35415D] transition-transform ${advancedOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {advancedOpen && (
          <div className="space-y-4 border-t border-[#E3E8F0] bg-[#FBFCFE] p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                id="profile-latitude"
                aria-label="Latitude"
                type="number"
                step="any"
                value={form.latitude ?? ''}
                onChange={(e) => setLatLng(e.target.value === '' ? null : Number(e.target.value), form.longitude)}
                className={INPUT_CLS}
                placeholder="Latitude"
              />
              <input
                id="profile-longitude"
                aria-label="Longitude"
                type="number"
                step="any"
                value={form.longitude ?? ''}
                onChange={(e) => setLatLng(form.latitude, e.target.value === '' ? null : Number(e.target.value))}
                className={INPUT_CLS}
                placeholder="Longitude"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-map-url" className="block text-sm font-medium text-[#35415D]">Coller un lien de carte</label>
              <input
                id="profile-map-url"
                type="text"
                value={mapUrl}
                onChange={(e) => handleMapUrlPaste(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData('text')
                  handleMapUrlPaste(pasted)
                  e.preventDefault()
                }}
                className={INPUT_CLS}
                placeholder="Google Maps, Apple Maps, OpenStreetMap ou « lat, lng »"
              />
              {mapUrlError && <p className="text-xs text-red-500">{mapUrlError}</p>}
            </div>

            {form.latitude !== null && form.longitude !== null && (
              <button
                type="button"
                onClick={() => setLatLng(null, null)}
                className="text-xs font-medium text-[#8290A8] transition-colors hover:text-red-600"
              >
                Effacer la position enregistrée
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
