'use client'

import { useState } from 'react'
import type { GeoState } from './types'

export function useGeoDetect(onSuccess: (lat: number, lng: number) => void) {
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
