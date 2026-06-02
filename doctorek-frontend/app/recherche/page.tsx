'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Header } from '@/components/Header'
import { BookingDrawer } from '@/features/agenda/components/BookingDrawer'
import type { DoctorMapEntry } from '@/features/annuaire/components/DoctorMap'
import { useGeolocation, useMedecin, useNearbyMedecins, useSearchMedecinsDisponibles } from '@/features/annuaire/hooks'
import type { SearchFormValues } from '@/features/annuaire/schemas'
import type { DisponibiliteFilter } from '@/lib/disponibilite'
import type { BookingSlot } from '@/lib/types'
import { SearchBar } from '@/features/recherche/components/SearchBar'
import { FilterBar } from '@/features/recherche/components/FilterBar'
import { ResultsList } from '@/features/recherche/components/ResultsList'
import { DesktopMapPanel, MobileMapOverlay } from '@/features/recherche/components/MapPanel'
import { MapIcon, ListIcon } from '@/features/recherche/components/icons'

const DoctorMap = dynamic(
  () => import('@/features/annuaire/components/DoctorMap').then((m) => ({ default: m.DoctorMap })),
  { ssr: false },
)

const PAGE_SIZE = 10

export default function RecherchePage() {
  const searchParams = useSearchParams()

  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const nearbyParam = searchParams.get('nearby')
  const urlCoords = latParam && lngParam ? { lat: Number(latParam), lng: Number(lngParam) } : null

  const [filter, setFilter] = useState<DisponibiliteFilter>('all')
  const [nearbyMode, setNearbyMode] = useState(nearbyParam === '1' && urlCoords !== null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const [bookingSlot, setBookingSlot] = useState<BookingSlot | null>(null)
  const [page, setPage] = useState(1)

  // Return-to-booking after login redirect
  const bookMedecinId = searchParams.get('bookMedecinId') ?? ''
  const bookDate = searchParams.get('bookDate') ?? ''
  const bookDebut = searchParams.get('bookDebut') ?? ''
  const bookFin = searchParams.get('bookFin') ?? ''
  const hasBookingParams = !!(bookMedecinId && bookDate && bookDebut && bookFin)
  const { data: bookMedecin } = useMedecin(bookMedecinId)

  useEffect(() => {
    if (hasBookingParams && bookMedecin) {
      setBookingSlot({ medecin: bookMedecin, date: bookDate, debut: bookDebut, fin: bookFin })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookMedecin])

  const { register, watch } = useForm<SearchFormValues>({
    defaultValues: {
      specialite: searchParams.get('specialite') ?? '',
      ville: searchParams.get('ville') ?? '',
    },
  })

  const [query, setQuery] = useState<SearchFormValues>({
    specialite: searchParams.get('specialite') ?? '',
    ville: searchParams.get('ville') ?? '',
  })

  const values = watch()
  useEffect(() => {
    setQuery({ specialite: values.specialite, ville: values.ville })
    setPage(1)
  }, [values.specialite, values.ville]) // eslint-disable-line react-hooks/exhaustive-deps

  const { state: geoState, request: requestGeo } = useGeolocation()
  const geoCoords =
    urlCoords ??
    (geoState.status === 'success' ? { lat: geoState.lat, lng: geoState.lng } : null)

  const handleNearbyClick = () => {
    setPage(1)
    if (nearbyMode) { setNearbyMode(false); return }
    if (geoState.status !== 'success' && !urlCoords) requestGeo()
    setNearbyMode(true)
  }

  useEffect(() => {
    if (nearbyMode && geoState.status === 'error' && !urlCoords) setNearbyMode(false)
  }, [nearbyMode, geoState.status, urlCoords])

  const searchResult = useSearchMedecinsDisponibles(
    nearbyMode ? '' : query.specialite,
    nearbyMode ? '' : query.ville,
    filter,
    nearbyMode ? 1 : page,
  )

  const nearbyResult = useNearbyMedecins(
    geoCoords?.lat ?? null,
    geoCoords?.lng ?? null,
    20,
    query.specialite,
  )

  const isLoading = nearbyMode ? nearbyResult.isLoading : searchResult.isLoading
  const isError = nearbyMode ? nearbyResult.isError : searchResult.isError
  const error = nearbyMode ? nearbyResult.error : searchResult.error

  const nearbyMedecins = nearbyResult.data ?? []
  const searchContent = searchResult.data?.content ?? []
  const availableTodayIds = useMemo(
    () => (filter === 'today' ? new Set(searchContent.map((m) => m.id)) : new Set<string>()),
    [filter, searchContent],
  )

  const totalResults = nearbyMode ? nearbyMedecins.length : (searchResult.data?.totalElements ?? 0)
  const totalPages = nearbyMode
    ? Math.ceil(totalResults / PAGE_SIZE)
    : (searchResult.data?.totalPages ?? 1)
  const offset = (page - 1) * PAGE_SIZE
  const pagedNearby = nearbyMedecins.slice(offset, offset + PAGE_SIZE)

  const handlePage = useCallback((p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleFilterChange = (f: DisponibiliteFilter) => {
    setFilter(f)
    setPage(1)
  }

  const mapDoctors = useMemo<DoctorMapEntry[]>(() => {
    const source = nearbyMode ? nearbyMedecins.map((r) => r.medecin) : searchContent
    return source
      .filter((m) => m.latitude != null && m.longitude != null)
      .map((m) => {
        const name = `${m.firstName}${m.lastName}`
        const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        return {
          id: m.id,
          lat: m.latitude!,
          lng: m.longitude!,
          name: `Dr. ${m.firstName} ${m.lastName}`,
          photoUrl: m.photoUrl ?? null,
          initials: `${m.firstName[0] ?? ''}${m.lastName[0] ?? ''}`.toUpperCase(),
          avatarColor: `hsl(${hash % 360}, 55%, 42%)`,
        }
      })
  }, [nearbyMode, nearbyMedecins, searchContent])

  const geoLoading =
    geoState.status === 'loading' ||
    (nearbyMode && geoCoords === null && geoState.status !== 'error')

  const pageStart = totalResults === 0 ? 0 : offset + 1
  const pageEnd = Math.min(offset + PAGE_SIZE, totalResults)
  const resultLabel = isLoading
    ? 'Chargement...'
    : nearbyMode
      ? `${totalResults} médecin${totalResults !== 1 ? 's' : ''} dans un rayon de 20 km${query.specialite ? ` · ${query.specialite}` : ''}${totalPages > 1 ? ` · ${pageStart}–${pageEnd} affichés` : ''}`
      : `${totalResults} médecin${totalResults !== 1 ? 's' : ''} trouvé${totalResults !== 1 ? 's' : ''}${query.specialite ? ` · ${query.specialite}` : ''}${query.ville ? ` à ${query.ville}` : ''}${totalPages > 1 ? ` · ${pageStart}–${pageEnd} affichés` : ''}`

  return (
    <>
      <Header sticky={false} />

      <div className="sticky top-0 z-40">
        <SearchBar register={register} nearbyMode={nearbyMode} />
        <FilterBar
          nearbyMode={nearbyMode}
          geoLoading={geoLoading}
          geoState={geoState}
          filter={filter}
          onNearbyClick={handleNearbyClick}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className="min-h-screen bg-[#EBF4FF]">
        <div className="mx-auto flex max-w-6xl">
          <ResultsList
            nearbyMode={nearbyMode}
            isLoading={isLoading}
            geoLoading={geoLoading}
            isError={isError}
            error={error}
            resultLabel={resultLabel}
            filter={filter}
            nearbyMedecins={nearbyMedecins}
            pagedNearby={pagedNearby}
            searchContent={searchContent}
            availableTodayIds={availableTodayIds}
            hasSearchData={!!searchResult.data}
            page={page}
            totalPages={totalPages}
            onPage={handlePage}
            onHover={setHoveredId}
            onBookSlot={setBookingSlot}
            mobileView={mobileView}
          />
          <DesktopMapPanel
            DoctorMap={DoctorMap}
            doctors={mapDoctors}
            hoveredId={hoveredId}
            center={geoCoords ?? undefined}
            isLoading={isLoading}
          />
        </div>
      </div>

      <MobileMapOverlay
        DoctorMap={DoctorMap}
        doctors={mapDoctors}
        hoveredId={hoveredId}
        center={geoCoords ?? undefined}
        isLoading={isLoading}
        mobileView={mobileView}
      />

      <BookingDrawer slot={bookingSlot} onClose={() => setBookingSlot(null)} />

      <button
        type="button"
        onClick={() => setMobileView(v => v === 'list' ? 'map' : 'list')}
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 lg:hidden flex items-center gap-2 rounded-full bg-[#007DFF] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-400/40 ring-1 ring-white/20 transition-all active:scale-95 hover:bg-[#00263C]"
      >
        {mobileView === 'list' ? <><MapIcon /> Vue Carte</> : <><ListIcon /> Vue Liste</>}
      </button>
    </>
  )
}
