'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type L from 'leaflet'

export interface DoctorMapEntry {
  id: string
  lat: number
  lng: number
  name: string
}

interface DoctorMapProps {
  doctors: DoctorMapEntry[]
  hoveredId: string | null
  center?: { lat: number; lng: number }
}

const COLOR_DEFAULT = '#1863A9'
const COLOR_HOVERED = '#E01E5A'

function makePinIcon(L: typeof import('leaflet'), hovered: boolean) {
  const color = hovered ? COLOR_HOVERED : COLOR_DEFAULT
  const w = hovered ? 32 : 24
  const h = hovered ? 48 : 36
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${w}" height="${h}"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="1.2"/><circle cx="12" cy="12" r="4.5" fill="white"/></svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    tooltipAnchor: [0, -h],
  })
}

export function DoctorMap({ doctors, hoveredId, center }: DoctorMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const lRef = useRef<typeof import('leaflet') | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const [mapReady, setMapReady] = useState(false)

  // Init map once — cache L in lRef so all effects share the same instance
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let cancelled = false

    async function init() {
      const L = (await import('leaflet')).default

      if (cancelled || !containerRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((containerRef.current as any)._leaflet_id) return

      const map = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      if (!cancelled) {
        lRef.current = L
        mapRef.current = map
        setMapReady(true)
      }
    }

    init()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      lRef.current = null
      markersRef.current.clear()
      setMapReady(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (containerRef.current) (containerRef.current as any)._leaflet_id = undefined
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync markers
  useEffect(() => {
    const L = lRef.current
    const map = mapRef.current
    if (!mapReady || !map || !L) return

    const existing = markersRef.current
    const newIds = new Set(doctors.map((d) => d.id))

    for (const [id, marker] of existing) {
      if (!newIds.has(id)) {
        marker.remove()
        existing.delete(id)
      }
    }

    for (const doc of doctors) {
      if (existing.has(doc.id)) continue
      const marker = L.marker([doc.lat, doc.lng], {
        icon: makePinIcon(L, doc.id === hoveredId),
      }).addTo(map)
      marker.bindTooltip(doc.name, { permanent: false, direction: 'top' })
      existing.set(doc.id, marker)
    }

    if (doctors.length > 0) {
      const points = doctors.map((d): [number, number] => [d.lat, d.lng])
      map.fitBounds(points, { padding: [40, 40], maxZoom: 13 })
    } else if (center) {
      map.setView([center.lat, center.lng], 11)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, mapReady])

  // Update hovered pin icon + flyTo
  useEffect(() => {
    const L = lRef.current
    const map = mapRef.current
    if (!mapReady || !map || !L) return

    for (const [id, marker] of markersRef.current) {
      marker.setIcon(makePinIcon(L, id === hoveredId))
    }

    if (hoveredId) {
      const doc = doctors.find((d) => d.id === hoveredId)
      if (doc) map.flyTo([doc.lat, doc.lng], 15, { duration: 0.7 })
    } else if (doctors.length > 0) {
      const points = doctors.map((d): [number, number] => [d.lat, d.lng])
      map.fitBounds(points, { padding: [40, 40], maxZoom: 13 })
    }
  }, [hoveredId, doctors, mapReady])

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ background: '#e8eff6' }}
    />
  )
}
