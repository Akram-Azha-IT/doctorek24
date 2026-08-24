'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
import type { SortKey, ActiveFilter } from '@/features/recherche/components/ResultsToolbar'
import { DesktopMapPanel, MobileMapOverlay } from '@/features/recherche/components/MapPanel'
import { MapIcon, ListIcon } from '@/features/recherche/components/icons'
import { buildRechercheUrl, readRechercheState, type RechercheState } from '@/features/recherche/searchState'

const DoctorMap = dynamic(
  () => import('@/features/annuaire/components/DoctorMap').then((m) => ({ default: m.DoctorMap })),
  { ssr: false },
)

const PAGE_SIZE = 5

export default function RecherchePage() {
  const searchParams = useSearchParams()
  const [initialSearchState] = useState(() => readRechercheState(searchParams))

  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  // Objet recréé à chaque rendu sans mémoïsation : l'effet qui en dépend se relancerait
  // en boucle.
  const urlCoords = useMemo(() => {
    const lat = Number(latParam)
    const lng = Number(lngParam)
    return latParam && lngParam && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
  }, [latParam, lngParam])

  const [filter, setFilter] = useState<DisponibiliteFilter>(initialSearchState.filter)
  const [selectedDate, setSelectedDate] = useState<string | null>(initialSearchState.date)
  const [sort, setSort] = useState<SortKey>(initialSearchState.sort)
  const [nearbyMode, setNearbyMode] = useState(initialSearchState.nearbyMode)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const [nearBottom, setNearBottom] = useState(false)

  useEffect(() => {
    function onScroll() {
      const threshold = 120 // px from bottom
      setNearBottom(window.innerHeight + window.scrollY >= document.body.offsetHeight - threshold)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const [bookingSlot, setBookingSlot] = useState<BookingSlot | null>(null)
  const [page, setPage] = useState(initialSearchState.page)

  // Return-to-booking after login redirect
  const bookMedecinId = searchParams.get('bookMedecinId') ?? ''
  const bookDate = searchParams.get('bookDate') ?? ''
  const bookDebut = searchParams.get('bookDebut') ?? ''
  const bookFin = searchParams.get('bookFin') ?? ''
  const hasBookingParams = !!(bookMedecinId && bookDate && bookDebut && bookFin)
  const [preserveBookingParams, setPreserveBookingParams] = useState(hasBookingParams)
  const { data: bookMedecin } = useMedecin(bookMedecinId)

  useEffect(() => {
    if (hasBookingParams && bookMedecin) {
      setBookingSlot({ medecin: bookMedecin, date: bookDate, debut: bookDebut, fin: bookFin })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookMedecin])

  const { register, watch, setValue } = useForm<SearchFormValues>({
    defaultValues: {
      specialite: initialSearchState.specialite,
      ville: initialSearchState.ville,
    },
  })

  const [query, setQuery] = useState<SearchFormValues>({
    specialite: initialSearchState.specialite,
    ville: initialSearchState.ville,
  })

  const values = watch()
  const previousSearchRef = useRef(query)
  useEffect(() => {
    const nextQuery = { specialite: values.specialite, ville: values.ville }
    const searchChanged =
      previousSearchRef.current.specialite !== nextQuery.specialite ||
      previousSearchRef.current.ville !== nextQuery.ville

    previousSearchRef.current = nextQuery
    setQuery(nextQuery)
    if (searchChanged) setPage(1)
  }, [values.specialite, values.ville])  

  const { state: geoState, request: requestGeo } = useGeolocation()
  const geoLat = geoState.status === 'success' ? geoState.lat : null
  const geoLng = geoState.status === 'success' ? geoState.lng : null
  const geoCoords = useMemo(
    () => urlCoords ?? (geoLat !== null && geoLng !== null ? { lat: geoLat, lng: geoLng } : null),
    [geoLat, geoLng, urlCoords],
  )

  const rechercheState = useMemo<RechercheState>(() => ({
    specialite: query.specialite,
    ville: query.ville,
    filter,
    date: selectedDate,
    sort,
    nearbyMode,
    page,
    coords: geoCoords,
  }), [filter, geoCoords, nearbyMode, page, query.specialite, query.ville, selectedDate, sort])

  const rechercheUrl = useMemo(
    () => buildRechercheUrl(searchParams, rechercheState, {
      removeBookingParams: !preserveBookingParams,
    }),
    [preserveBookingParams, rechercheState, searchParams],
  )
  const cleanRechercheUrl = useMemo(
    () => buildRechercheUrl(searchParams, rechercheState, { removeBookingParams: true }),
    [rechercheState, searchParams],
  )

  // L'URL est la sauvegarde durable de la liste visible. replaceState évite une
  // navigation Next.js et conserve donc aussi le scroll et le tiroir en cours.
  useEffect(() => {
    const currentUrl = `${window.location.pathname}${window.location.search}`
    if (currentUrl !== rechercheUrl) {
      window.history.replaceState(window.history.state, '', rechercheUrl)
    }
  }, [rechercheUrl])

  const handleBookingClose = useCallback(() => {
    setBookingSlot(null)
    setPreserveBookingParams(false)
    window.history.replaceState(window.history.state, '', cleanRechercheUrl)
  }, [cleanRechercheUrl])

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
    selectedDate,
    PAGE_SIZE,
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
  const isFetching = nearbyMode ? nearbyResult.isFetching : searchResult.isFetching
  const retry = useCallback(() => {
    if (nearbyMode) nearbyResult.refetch()
    else searchResult.refetch()
  }, [nearbyMode, nearbyResult, searchResult])

  // Sans useMemo, `?? []` fabrique un tableau neuf à chaque rendu : les useMemo qui en
  // dépendent se recalculeraient toujours, la mémoïsation ne servirait à rien.
  const nearbyMedecins = useMemo(() => nearbyResult.data ?? [], [nearbyResult.data])
  const searchContent = useMemo(() => searchResult.data?.content ?? [], [searchResult.data?.content])
  const totalResults = nearbyMode ? nearbyMedecins.length : (searchResult.data?.totalElements ?? 0)
  const totalPages = nearbyMode
    ? Math.ceil(totalResults / PAGE_SIZE)
    : (searchResult.data?.totalPages ?? 1)
  const offset = (page - 1) * PAGE_SIZE
  const pagedNearby = nearbyMedecins.slice(offset, offset + PAGE_SIZE)

  // Tri client-side de l'affichage courant (nom A→Z ; distance = ordre backend nearby)
  const byNom = (a: { firstName: string; lastName: string }, b: { firstName: string; lastName: string }) =>
    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'fr', { sensitivity: 'base' })
  const sortedSearchContent = useMemo(
    () => (sort === 'nom' ? [...searchContent].sort(byNom) : searchContent),
    [sort, searchContent],
  )
  const sortedPagedNearby = useMemo(
    () => (sort === 'nom' ? [...pagedNearby].sort((a, b) => byNom(a.medecin, b.medecin)) : pagedNearby),
    [sort, pagedNearby],
  )

  const handlePage = useCallback((p: number) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleFilterChange = (f: DisponibiliteFilter) => {
    setFilter(f)
    setSelectedDate(null)
    setPage(1)
  }

  const handleAvailabilityChange = (value: { filter: DisponibiliteFilter; date: string | null }) => {
    setFilter(value.filter)
    setSelectedDate(value.date)
    setPage(1)
  }

  const mapDoctors = useMemo<DoctorMapEntry[]>(() => {
    const source = nearbyMode ? nearbyMedecins.map((r) => r.medecin) : searchContent
    return source
      .filter((m) => m.latitude != null && m.longitude != null && isFinite(m.latitude!) && isFinite(m.longitude!))
      .map((m) => {
        const name = `${m.firstName}${m.lastName}`
        const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        return {
          id: m.id,
          lat: Number(m.latitude),
          lng: Number(m.longitude),
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

  // Filtres actifs (chips retirables) façon Booking
  const activeFilters: ActiveFilter[] = []
  if (nearbyMode) {
    activeFilters.push({ key: 'nearby', label: 'À proximité (20 km)', onRemove: handleNearbyClick })
  } else {
    if (query.specialite) {
      activeFilters.push({ key: 'spec', label: query.specialite, onRemove: () => setValue('specialite', '') })
    }
    if (query.ville) {
      activeFilters.push({ key: 'ville', label: query.ville, onRemove: () => setValue('ville', '') })
    }
  }
  if (selectedDate) {
    const dateLabel = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(new Date(`${selectedDate}T00:00:00`))
    activeFilters.push({
      key: 'date',
      label: `Disponible le ${dateLabel}`,
      onRemove: () => setSelectedDate(null),
    })
  } else if (filter === 'today') {
    activeFilters.push({ key: 'today', label: "Disponible aujourd'hui", onRemove: () => handleFilterChange('all') })
  } else if (filter === 'week') {
    activeFilters.push({ key: 'week', label: 'Disponible cette semaine', onRemove: () => handleFilterChange('all') })
  }

  return (
    <>
      <Header sticky={false} />

      <div className="sticky top-0 z-40">
        <SearchBar
          register={register}
          nearbyMode={nearbyMode}
          villeValue={values.ville}
          onVilleChange={(v) => setValue('ville', v)}
          onNearbyClick={handleNearbyClick}
          nearbyLoading={geoLoading}
          filter={filter}
          date={selectedDate}
          onAvailabilityChange={handleAvailabilityChange}
          onSearch={() => window.scrollTo({ top: 200, behavior: 'smooth' })}
        />
        <FilterBar
          nearbyMode={nearbyMode}
          geoLoading={geoLoading}
          geoState={geoState}
          filter={filter}
          date={selectedDate}
          sort={sort}
          onNearbyClick={handleNearbyClick}
          onAvailabilityChange={handleAvailabilityChange}
          onSortChange={setSort}
        />
      </div>

      <div className="min-h-screen bg-[#F6F9FC]">
        <div className="mx-auto flex max-w-6xl gap-6 lg:px-4">
          <ResultsList
            nearbyMode={nearbyMode}
            isLoading={isLoading}
            geoLoading={geoLoading}
            isError={isError}
            error={error}
            onRetry={retry}
            isRetrying={isFetching}
            total={totalResults}
            activeFilters={activeFilters}
            filter={filter}
            exactDate={selectedDate}
            ville={nearbyMode ? '' : query.ville}
            specialite={nearbyMode ? '' : query.specialite}
            nearbyMedecins={nearbyMedecins}
            pagedNearby={sortedPagedNearby}
            searchContent={sortedSearchContent}
            hasSearchData={!!searchResult.data}
            page={page}
            totalPages={totalPages}
            onPage={handlePage}
            onHover={setHoveredId}
            onBookSlot={setBookingSlot}
            onFilterChange={handleFilterChange}
            onClearAvailability={() => {
              setFilter('all')
              setSelectedDate(null)
            }}
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

      <BookingDrawer
        slot={bookingSlot}
        returnUrl={cleanRechercheUrl}
        onClose={handleBookingClose}
      />

      <button
        type="button"
        onClick={() => setMobileView(v => v === 'list' ? 'map' : 'list')}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden flex items-center gap-2 rounded-full bg-[#007DFF] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-400/40 ring-1 ring-white/20 active:scale-95 hover:bg-[#00263C] transition-all duration-300 ${
          nearBottom || bookingSlot ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'
        }`}
      >
        {mobileView === 'list' ? <><MapIcon /> Vue Carte</> : <><ListIcon /> Vue Liste</>}
      </button>
    </>
  )
}
