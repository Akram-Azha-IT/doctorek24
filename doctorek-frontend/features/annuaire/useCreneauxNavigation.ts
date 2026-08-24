'use client'

import { useState, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { getCreneaux } from '@/features/agenda/api'
import type { Creneau } from '@/lib/types'
import { nextNDaysISO } from '@/lib/disponibilite'

/** Jours affichés simultanément dans le sélecteur de dates. */
const WINDOW_SIZE = 5
/** Profondeur de recherche au-delà de la fenêtre quand aucun jour visible n'a de place. */
const LOOKAHEAD_DAYS = 25

function hasFutureSlots(date: string, todayISO: string, data: Creneau[] | undefined): boolean {
  if (!data) return false
  const available = data.filter((s) => s.disponible)
  if (date !== todayISO) return available.length > 0
  const now = new Date()
  return available.some((s) => {
    const [h, m] = s.debut.split(':').map(Number)
    const t = new Date()
    t.setHours(h, m, 0, 0)
    return t > now
  })
}

/**
 * Navigation dans les créneaux d'un médecin : fenêtre de jours, jour sélectionné,
 * et recherche de la prochaine disponibilité quand la fenêtre est vide.
 *
 * <p>Extrait de la carte de résultat, dont il représentait l'essentiel de la
 * complexité. Le composant n'a plus qu'à afficher ce que ce hook calcule.
 */
export function useCreneauxNavigation(medecinId: string, preferredDate: string | null = null) {
  const allFutureDates = useMemo(() => nextNDaysISO(365), [])
  const preferredIndex = preferredDate ? allFutureDates.indexOf(preferredDate) : -1
  const initialIndex = preferredIndex >= 0 ? preferredIndex : 0
  const [windowStart, setWindowStart] = useState(initialIndex)
  const [selectedDate, setSelectedDate] = useState(allFutureDates[initialIndex])
  const [showAll, setShowAll] = useState(false)

  const visibleDates = useMemo(
    () => allFutureDates.slice(windowStart, windowStart + WINDOW_SIZE),
    [allFutureDates, windowStart],
  )
  const extendedDates = useMemo(
    () => allFutureDates.slice(windowStart + WINDOW_SIZE, windowStart + WINDOW_SIZE + LOOKAHEAD_DAYS),
    [allFutureDates, windowStart],
  )

  // Replier les créneaux au changement de jour — pendant le rendu, pas dans un effet.
  const [prevSelectedDate, setPrevSelectedDate] = useState(selectedDate)
  if (prevSelectedDate !== selectedDate) {
    setPrevSelectedDate(selectedDate)
    setShowAll(false)
  }

  // Garder le jour sélectionné à l'intérieur de la fenêtre quand elle se déplace.
  const [prevWindowStart, setPrevWindowStart] = useState(windowStart)
  if (prevWindowStart !== windowStart) {
    setPrevWindowStart(windowStart)
    if (!visibleDates.includes(selectedDate)) setSelectedDate(visibleDates[0])
  }

  const visibleResults = useQueries({
    queries: visibleDates.map((date) => ({
      queryKey: ['creneaux', medecinId, date],
      queryFn: () => getCreneaux(medecinId, date),
      staleTime: 30_000,
    })),
  })

  const selectedResult = visibleResults[visibleDates.indexOf(selectedDate)]
  const slots = useMemo(() => selectedResult?.data ?? [], [selectedResult?.data])
  const isLoading = selectedResult?.isLoading ?? true

  const todayISO = allFutureDates[0]
  const allLoaded = visibleResults.every((r) => !r.isLoading)
  const allUnavailable =
    allLoaded && visibleResults.every((r, i) => !hasFutureSlots(visibleDates[i], todayISO, r.data))

  // Interrogé seulement lorsque les cinq jours visibles sont pleins.
  const extendedResults = useQueries({
    queries: extendedDates.map((date) => ({
      queryKey: ['creneaux', medecinId, date],
      queryFn: () => getCreneaux(medecinId, date),
      staleTime: 30_000,
      enabled: allUnavailable,
    })),
  })

  const firstVisibleAvailableInfo = (() => {
    for (let i = 0; i < visibleDates.length; i++) {
      const date = visibleDates[i]
      const candidates = (visibleResults[i]?.data ?? []).filter((slot) => slot.disponible)
      const slot = date === todayISO
        ? candidates.find((candidate) => {
            const [hours, minutes] = candidate.debut.split(':').map(Number)
            const slotTime = new Date()
            slotTime.setHours(hours, minutes, 0, 0)
            return slotTime > new Date()
          })
        : candidates[0]
      if (slot) return { date, heure: slot.debut }
    }
    return null
  })()

  const nextAvailableInfo = firstVisibleAvailableInfo ?? (() => {
    if (!allUnavailable) return null
    for (let i = 0; i < extendedDates.length; i++) {
      const slot = extendedResults[i]?.data?.find((s) => s.disponible)
      if (slot) return { date: extendedDates[i], heure: slot.debut }
    }
    return null
  })()

  const availableSlots = useMemo(() => {
    const isToday = selectedDate === allFutureDates[0]
    const now = new Date()
    return slots.filter((s) => {
      if (!s.disponible) return false
      if (!isToday) return true
      const [h, m] = s.debut.split(':').map(Number)
      const slotTime = new Date()
      slotTime.setHours(h, m, 0, 0)
      return slotTime > now
    })
  }, [slots, selectedDate, allFutureDates])

  /** Positionne la fenêtre sur une date et la sélectionne (saut vers une dispo lointaine). */
  function goToDate(date: string) {
    const idx = allFutureDates.indexOf(date)
    if (idx === -1) return
    setWindowStart(idx)
    setSelectedDate(date)
  }

  return {
    visibleDates,
    /** Aligné sur visibleDates : indique quels jours ont encore une place. */
    daysWithSlots: visibleDates.map((date, i) =>
      !visibleResults[i]?.isLoading && hasFutureSlots(date, todayISO, visibleResults[i]?.data),
    ),
    goToDate,
    allUnavailable,
    selectedDate,
    setSelectedDate,
    windowStart,
    setWindowStart,
    showAll,
    setShowAll,
    isLoading,
    availableSlots,
    isUnavailable: !isLoading && availableSlots.length === 0,
    nextAvailableInfo,
    extendedLoading: allUnavailable && extendedResults.some((r) => r.isLoading),
  }
}
