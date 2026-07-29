import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { ListeAttenteCard } from './ListeAttenteCard'
import type { ListeAttente } from '@/lib/types'

const useListeAttente = vi.fn()
const rejoindre = vi.fn()
const quitter = vi.fn()

vi.mock('@/features/agenda/hooks', () => ({
  useListeAttente: (patientId: string) => useListeAttente(patientId),
  useRejoindreListeAttente: () => ({ mutate: rejoindre, isPending: false, isError: false }),
  useQuitterListeAttente: () => ({ mutate: quitter, isPending: false }),
}))

const MEDECIN = 'med-1'
const PATIENT = 'pat-1'

function inscription(over: Partial<ListeAttente> = {}): ListeAttente {
  return {
    id: 'la-1',
    medecinId: MEDECIN,
    patientId: PATIENT,
    dateDebut: '2026-08-01',
    dateFin: '2026-08-31',
    statut: 'ACTIVE',
    createdAt: '2026-07-29T10:00:00Z',
    ...over,
  }
}

function setup(inscriptions: ListeAttente[] = []) {
  useListeAttente.mockReturnValue({ data: inscriptions })
  render(<ListeAttenteCard medecinId={MEDECIN} patientId={PATIENT} medecinNom="Dr. Hakim Tazi" />)
}

describe('ListeAttenteCard', () => {
  beforeEach(() => {
    rejoindre.mockClear()
    quitter.mockClear()
    useListeAttente.mockReset()
  })

  test('annonce la règle du premier arrivé avant toute inscription', () => {
    // Arrange & Act — celui qui arrive second doit comprendre d'avance.
    setup()

    // Assert
    expect(screen.getByText(/premier qui réserve/)).toBeInTheDocument()
  })

  test('inscrit le patient sur la plage choisie', () => {
    // Arrange
    setup()

    // Act
    screen.getByRole('button', { name: 'Me prévenir' }).click()

    // Assert
    expect(rejoindre).toHaveBeenCalledWith(
      expect.objectContaining({ medecinId: MEDECIN, patientId: PATIENT }),
    )
  })

  test('affiche la période suivie quand le patient est déjà inscrit', () => {
    // Arrange & Act
    setup([inscription()])

    // Assert
    expect(screen.getByText(/Vous êtes en liste d'attente/)).toBeInTheDocument()
    expect(screen.getByText(/1 août au 31 août/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Me prévenir' })).not.toBeInTheDocument()
  })

  test('permet de quitter la liste', () => {
    // Arrange
    setup([inscription()])

    // Act
    screen.getByRole('button', { name: 'Quitter la liste' }).click()

    // Assert
    expect(quitter).toHaveBeenCalledWith('la-1')
  })

  test('ignore une inscription chez un autre médecin', () => {
    // Arrange & Act
    setup([inscription({ medecinId: 'autre-medecin' })])

    // Assert
    expect(screen.getByRole('button', { name: 'Me prévenir' })).toBeInTheDocument()
  })
})
