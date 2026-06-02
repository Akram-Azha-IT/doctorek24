'use client'

import { useState } from 'react'
import { INPUT_CLS } from '../constants'
import { parseMapUrl } from '../utils'
import { useGeoDetect } from '../hooks'
import type { ProfilForm } from '../types'

interface LocalisationSectionProps {
  form: ProfilForm
  setLatLng: (lat: number | null, lng: number | null) => void
}

export function LocalisationSection({ form, setLatLng }: LocalisationSectionProps) {
  const [mapUrl, setMapUrl] = useState('')
  const [mapUrlError, setMapUrlError] = useState('')

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
            onClick={() => setLatLng(null, null)}
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
            onChange={(e) => setLatLng(e.target.value === '' ? null : Number(e.target.value), form.longitude)}
            className={INPUT_CLS + ' w-36 text-sm'}
            placeholder="Latitude"
          />
          <input
            type="number"
            step="any"
            value={form.longitude ?? ''}
            onChange={(e) => setLatLng(form.latitude, e.target.value === '' ? null : Number(e.target.value))}
            className={INPUT_CLS + ' w-36 text-sm'}
            placeholder="Longitude"
          />
        </div>
      </div>

      {geo.status === 'error' && (
        <p className="text-sm text-red-600">{geo.message}</p>
      )}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">Coller un lien de carte</label>
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
            className={INPUT_CLS + ' flex-1'}
            placeholder="Google Maps, Apple Maps, OpenStreetMap ou « lat, lng »"
          />
        </div>
        {mapUrlError && <p className="text-xs text-red-500">{mapUrlError}</p>}
        <p className="text-xs text-zinc-400">
          Collez le lien de partage depuis Google Maps, Apple Maps, OpenStreetMap ou Bing Maps.
        </p>
      </div>
    </section>
  )
}
