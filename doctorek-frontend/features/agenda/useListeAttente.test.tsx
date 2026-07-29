import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useListeAttente, useRejoindreListeAttente, useQuitterListeAttente } from './hooks'
import type { ListeAttente } from '@/lib/types'

const apiFetch = vi.fn()
vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}))

const PATIENT = 'pat-1'
const MEDECIN = 'med-1'

const inscription: ListeAttente = {
  id: 'la-1',
  medecinId: MEDECIN,
  patientId: PATIENT,
  dateDebut: '2026-08-01',
  dateFin: '2026-08-31',
  statut: 'ACTIVE',
  createdAt: '2026-07-29T10:00:00Z',
}

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('hooks liste d’attente', () => {
  beforeEach(() => apiFetch.mockReset())

  test('charge les inscriptions du patient', async () => {
    // Arrange
    apiFetch.mockResolvedValue([inscription])

    // Act
    const { result } = renderHook(() => useListeAttente(PATIENT), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.data).toEqual([inscription]))
    expect(apiFetch).toHaveBeenCalledWith(`/api/v1/agenda/patients/${PATIENT}/liste-attente`)
  })

  test('ne requête rien sans patient', () => {
    // Arrange & Act — l'écran s'affiche avant que la session soit résolue.
    renderHook(() => useListeAttente(''), { wrapper })

    // Assert
    expect(apiFetch).not.toHaveBeenCalled()
  })

  test('poste la plage demandée à l’inscription', async () => {
    // Arrange
    apiFetch.mockResolvedValue(inscription)
    const { result } = renderHook(() => useRejoindreListeAttente(PATIENT), { wrapper })

    // Act
    act(() =>
      result.current.mutate({
        medecinId: MEDECIN,
        patientId: PATIENT,
        dateDebut: '2026-08-01',
        dateFin: '2026-08-31',
      }),
    )

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiFetch).toHaveBeenCalledWith('/api/v1/agenda/liste-attente', {
      method: 'POST',
      body: JSON.stringify({
        medecinId: MEDECIN,
        patientId: PATIENT,
        dateDebut: '2026-08-01',
        dateFin: '2026-08-31',
      }),
    })
  })

  test('supprime l’inscription au retrait', async () => {
    // Arrange
    apiFetch.mockResolvedValue(undefined)
    const { result } = renderHook(() => useQuitterListeAttente(PATIENT), { wrapper })

    // Act
    act(() => result.current.mutate('la-1'))

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiFetch).toHaveBeenCalledWith('/api/v1/agenda/liste-attente/la-1', { method: 'DELETE' })
  })
})
