'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import type L from 'leaflet'

export interface DoctorMapEntry {
  id: string
  lat: number
  lng: number
  name: string
  photoUrl?: string | null
  initials?: string
  avatarColor?: string
}

interface DoctorMapProps {
  doctors: DoctorMapEntry[]
  hoveredId: string | null
  center?: { lat: number; lng: number }
}

const COLOR_DEFAULT = '#1863A9'
const COLOR_HOVERED = '#E01E5A'

function makeAvatarIcon(
  L: typeof import('leaflet'),
  doc: DoctorMapEntry,
  hovered: boolean,
) {
  const border = hovered ? COLOR_HOVERED : COLOR_DEFAULT
  const size = hovered ? 52 : 44
  const tipColor = hovered ? COLOR_HOVERED : COLOR_DEFAULT

  const inner = doc.photoUrl
    ? `<img src="${doc.photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
    : `<span style="font-size:${hovered ? 16 : 14}px;font-weight:700;color:#fff;font-family:system-ui,sans-serif">${doc.initials ?? ''}</span>`

  const bgColor = doc.photoUrl ? 'transparent' : (doc.avatarColor ?? COLOR_DEFAULT)

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.35))">
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        border:2.5px solid ${border};
        background:${bgColor};
        display:flex;align-items:center;justify-content:center;
        overflow:hidden;
        box-sizing:border-box;
      ">${inner}</div>
      <div style="
        width:0;height:0;
        border-left:7px solid transparent;
        border-right:7px solid transparent;
        border-top:9px solid ${tipColor};
        margin-top:-1px;
      "></div>
    </div>`

  const totalH = size + 9
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, totalH],
    iconAnchor: [size / 2, totalH],
    tooltipAnchor: [0, -(totalH)],
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

    // Capturés à l'exécution de l'effet : au moment du nettoyage, React a pu détacher
    // le conteneur, et lire ref.current à cet instant viserait une autre valeur.
    const container = containerRef.current
    const markers = markersRef.current

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

      // Vue par défaut (centre Maroc) — garantit que la carte a toujours un
      // centre valide, même sans résultats ni géoloc. Sinon flyTo/fitBounds
      // partent d'un centre NaN → "Invalid LatLng (NaN, NaN)".
      map.setView([31.7917, -7.0926], 6)

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
      markers.clear()
      setMapReady(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(container as any)._leaflet_id = undefined
    }
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
      const lat = Number(doc.lat); const lng = Number(doc.lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
      const marker = L.marker([lat, lng], {
        icon: makeAvatarIcon(L, doc, doc.id === hoveredId),
      }).addTo(map)
      marker.bindTooltip(doc.name, { permanent: false, direction: 'top' })
      existing.set(doc.id, marker)
    }

    const sized = map.getSize().x > 0 && map.getSize().y > 0
    if (!sized) return // carte masquée/0px : projections NaN → on n'ajuste pas la vue
    if (doctors.length > 0) {
      const points = doctors
        .map((d): [number, number] => [Number(d.lat), Number(d.lng)])
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng))
      if (points.length > 0) map.fitBounds(points, { padding: [40, 40], maxZoom: 13 })
    } else if (center) {
      const clat = Number(center.lat); const clng = Number(center.lng)
      if (Number.isFinite(clat) && Number.isFinite(clng)) map.setView([clat, clng], 11)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, mapReady])

  // Update hovered pin icon + flyTo
  useEffect(() => {
    const L = lRef.current
    const map = mapRef.current
    if (!mapReady || !map || !L) return

    for (const [id, marker] of markersRef.current) {
      const doc = doctors.find((d) => d.id === id)
      if (doc) marker.setIcon(makeAvatarIcon(L, doc, id === hoveredId))
    }

    const sized = map.getSize().x > 0 && map.getSize().y > 0
    if (!sized) return // carte masquée/0px : flyTo/fitBounds projetteraient NaN
    if (hoveredId) {
      const doc = doctors.find((d) => d.id === hoveredId)
      if (doc) {
        const lat = Number(doc.lat); const lng = Number(doc.lng)
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          map.flyTo([lat, lng], 15, { duration: 0.7 })
        }
      }
    } else if (doctors.length > 0) {
      const points = doctors
        .map((d): [number, number] => [Number(d.lat), Number(d.lng)])
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng))
      if (points.length > 0) map.fitBounds(points, { padding: [40, 40], maxZoom: 13 })
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
