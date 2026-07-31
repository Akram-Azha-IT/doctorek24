import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { MesAlertes } from './MesAlertes'
import type { ListeAttente } from '@/lib/types'

const useListeAttente = vi.fn()
const quitter = vi.fn()

vi.mock('@/features/agenda/hooks', () => ({
  useListeAttente: (patientId: string) => useListeAttente(patientId),
  useQuitterListeAttente: () => ({ mutate: quitter, isPending: false }),
}))
vi.mock('@/features/annuaire/hooks', () => ({
  useMedecin: () => ({ data: { firstName: 'Hakim', lastName: 'Tazi' } }),
}))

const PATIENT = 'pat-1'

function inscription(over: Partial<ListeAttente> = {}): ListeAttente {
  return {
    id: 'la-1',
    medecinId: 'med-1',
    patientId: PATIENT,
    dateDebut: '2026-08-01',
    dateFin: '2026-08-31',
    statut: 'ACTIVE',
    createdAt: '2026-07-29T10:00:00Z',
    ...over,
  }
}

function setup(data: ListeAttente[] | undefined) {
  useListeAttente.mockReturnValue({ data })
  return render(<MesAlertes patientId={PATIENT} />)
}

describe('MesAlertes', () => {
  beforeEach(() => {
    quitter.mockClear()
    useListeAttente.mockReset()
  })

  test('reste invisible quand le patient n’attend rien', () => {
    // Arrange & Act — la section ne doit pas alourdir la page pour rien.
    const { container } = setup([])

    // Assert
    expect(container).toBeEmptyDOMElement()
  })

  test('reste invisible pendant le chargement', () => {
    const { container } = setup(undefined)
    expect(container).toBeEmptyDOMElement()
  })

  test('nomme le médecin et la période suivie', () => {
    // Arrange & Act
    setup([inscription()])

    // Assert
    expect(screen.getByRole('link', { name: 'Dr. Hakim Tazi' })).toHaveAttribute(
      'href',
      '/medecins/med-1/rdv',
    )
    expect(screen.getByText(/1 août au 31 août/)).toBeInTheDocument()
  })

  test('permet de se retirer d’une alerte', () => {
    // Arrange
    setup([inscription(), inscription({ id: 'la-2', medecinId: 'med-2' })])

    // Act
    screen.getAllByRole('button', { name: 'Retirer' })[1].click()

    // Assert
    expect(quitter).toHaveBeenCalledWith('la-2')
  })
})
