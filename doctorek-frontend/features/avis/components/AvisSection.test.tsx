import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { AvisPage } from '@/lib/types'
import { AvisSection } from './AvisSection'

const useAvisMedecin = vi.fn()

vi.mock('../hooks', () => ({
  useAvisMedecin: (medecinId: string, page: number) => useAvisMedecin(medecinId, page),
  useSignalerAvis: () => ({ mutate: vi.fn(), isPending: false }),
}))

function page(surcharge: Partial<AvisPage> = {}): AvisPage {
  return {
    content: [
      {
        id: 'avis-1',
        note: 5,
        commentaire: 'Ponctuel',
        auteur: 'Akram B.',
        anonyme: false,
        statut: 'PUBLIE',
        createdAt: '2026-05-14T10:00:00Z',
      },
    ],
    totalElements: 1,
    totalPages: 1,
    page: 1,
    size: 10,
    noteMoyenne: 5,
    nombreAvis: 1,
    repartition: [0, 0, 0, 0, 1],
    ...surcharge,
  }
}

describe('AvisSection', () => {
  beforeEach(() => vi.clearAllMocks())

  test('signale le chargement au lieu d’afficher une section vide', () => {
    useAvisMedecin.mockReturnValue({ data: undefined, isLoading: true, isError: false })

    render(<AvisSection medecinId="med-1" />)

    expect(screen.getByLabelText('Chargement des avis')).toBeInTheDocument()
  })

  test('annonce l’échec plutôt que de laisser croire à zéro avis', () => {
    useAvisMedecin.mockReturnValue({ data: undefined, isLoading: false, isError: true })

    render(<AvisSection medecinId="med-1" />)

    expect(screen.getByText(/n'ont pas pu être chargés/)).toBeInTheDocument()
  })

  test('affiche la synthèse et la liste', () => {
    useAvisMedecin.mockReturnValue({ data: page(), isLoading: false, isError: false })

    render(<AvisSection medecinId="med-1" />)

    expect(screen.getByText('Ponctuel')).toBeInTheDocument()
  })

  test('un médecin sans avis n’affiche pas de liste vide sous la synthèse', () => {
    useAvisMedecin.mockReturnValue({
      data: page({ content: [], nombreAvis: 0, totalElements: 0, noteMoyenne: null }),
      isLoading: false,
      isError: false,
    })

    render(<AvisSection medecinId="med-1" />)

    expect(screen.queryByText('Aucun avis publié pour le moment.')).not.toBeInTheDocument()
  })

  test('la pagination reste cachée tant qu’une page suffit', () => {
    useAvisMedecin.mockReturnValue({ data: page(), isLoading: false, isError: false })

    render(<AvisSection medecinId="med-1" />)

    expect(screen.queryByLabelText('Pagination des avis')).not.toBeInTheDocument()
  })

  test('la page suivante est redemandée au serveur', async () => {
    useAvisMedecin.mockReturnValue({
      data: page({ totalPages: 3, totalElements: 25, nombreAvis: 25 }),
      isLoading: false,
      isError: false,
    })

    render(<AvisSection medecinId="med-1" />)
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }))

    expect(useAvisMedecin).toHaveBeenLastCalledWith('med-1', 2)
  })

  test('la première page ne propose pas de précédent actif', () => {
    useAvisMedecin.mockReturnValue({
      data: page({ totalPages: 3, totalElements: 25, nombreAvis: 25 }),
      isLoading: false,
      isError: false,
    })

    render(<AvisSection medecinId="med-1" />)

    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled()
  })
})
