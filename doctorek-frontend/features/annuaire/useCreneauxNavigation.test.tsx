import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCreneauxNavigation } from './useCreneauxNavigation'
import { nextNDaysISO } from '@/lib/disponibilite'
import type { Creneau } from '@/lib/types'

const dates = nextNDaysISO(40)
/** Demain : évite le filtrage des heures déjà passées appliqué au jour même. */
const TOMORROW = dates[1]
/** Au-delà de la fenêtre de 5 jours — sert à vérifier la recherche étendue. */
const FAR_DAY = dates[12]

const slots = [
  { debut: '09:00', fin: '09:30', disponible: true },
  { debut: '09:30', fin: '10:00', disponible: false },
  { debut: '10:00', fin: '10:30', disponible: true },
] as Creneau[]

const getCreneauxMock = vi.fn<(id: string, date: string) => Promise<Creneau[]>>(async () => [])
vi.mock('@/features/agenda/api', () => ({
  getCreneaux: (id: string, date: string) => getCreneauxMock(id, date),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const setup = () => renderHook(() => useCreneauxNavigation('m1'), { wrapper })

describe('useCreneauxNavigation', () => {
  beforeEach(() => {
    getCreneauxMock.mockReset()
    getCreneauxMock.mockImplementation(async () => [])
  })

  test('ouvre sur une fenêtre de cinq jours à partir d’aujourd’hui', async () => {
    const { result } = setup()
    expect(result.current.visibleDates).toHaveLength(5)
    expect(result.current.visibleDates[0]).toBe(dates[0])
    expect(result.current.selectedDate).toBe(dates[0])
  })

  test('ouvre sur la date précise fournie par la recherche', async () => {
    const { result } = renderHook(() => useCreneauxNavigation('m1', FAR_DAY), { wrapper })

    expect(result.current.selectedDate).toBe(FAR_DAY)
    expect(result.current.visibleDates[0]).toBe(FAR_DAY)
  })

  test('ne retient que les créneaux disponibles du jour sélectionné', async () => {
    getCreneauxMock.mockImplementation(async (_id, date) => (date === TOMORROW ? slots : []))
    const { result } = setup()

    act(() => result.current.setSelectedDate(TOMORROW))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.availableSlots.map((s) => s.debut)).toEqual(['09:00', '10:00'])
    expect(result.current.isUnavailable).toBe(false)
  })

  test('signale un jour sans place', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.availableSlots).toEqual([])
    expect(result.current.isUnavailable).toBe(true)
    expect(result.current.daysWithSlots.every((d) => d === false)).toBe(true)
  })

  test('cherche au-delà de la fenêtre quand les cinq jours sont pleins', async () => {
    getCreneauxMock.mockImplementation(async (_id, date) => (date === FAR_DAY ? slots : []))
    const { result } = setup()

    await waitFor(() => expect(result.current.allUnavailable).toBe(true))
    await waitFor(() => expect(result.current.nextAvailableInfo).not.toBeNull())

    expect(result.current.nextAvailableInfo).toEqual({ date: FAR_DAY, heure: '09:00' })
  })

  test('goToDate recadre la fenêtre sur la date visée', async () => {
    const { result } = setup()

    act(() => result.current.goToDate(FAR_DAY))

    expect(result.current.selectedDate).toBe(FAR_DAY)
    expect(result.current.visibleDates[0]).toBe(FAR_DAY)
  })

  test('goToDate ignore une date hors de la plage couverte', async () => {
    const { result } = setup()
    const before = result.current.selectedDate

    act(() => result.current.goToDate('1999-01-01'))

    expect(result.current.selectedDate).toBe(before)
  })

  test('replie les créneaux dépliés quand on change de jour', async () => {
    const { result } = setup()

    act(() => result.current.setShowAll(true))
    expect(result.current.showAll).toBe(true)

    act(() => result.current.setSelectedDate(TOMORROW))
    expect(result.current.showAll).toBe(false)
  })

  test('ramène la sélection dans la fenêtre quand celle-ci se déplace', async () => {
    const { result } = setup()
    expect(result.current.selectedDate).toBe(dates[0])

    act(() => result.current.setWindowStart(10))

    expect(result.current.visibleDates[0]).toBe(dates[10])
    expect(result.current.selectedDate).toBe(dates[10])
  })
})
