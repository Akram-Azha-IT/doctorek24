import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { ConsentementGate } from './ConsentementGate'

const statut = vi.fn()
const accepter = vi.fn()
const logout = vi.fn()

vi.mock('../hooks', () => ({
  useConsentementStatut: () => statut(),
  useAccepterConsentement: () => ({ mutate: accepter, isPending: false, isError: false }),
}))
vi.mock('@/lib/auth', () => ({ logout: () => logout() }))

describe('ConsentementGate', () => {
  beforeEach(() => vi.clearAllMocks())

  test('ne demande rien tant que la réponse du serveur n’est pas arrivée', () => {
    statut.mockReturnValue({ data: undefined, isLoading: true })

    const { container } = render(<ConsentementGate />)

    expect(container).toBeEmptyDOMElement()
  })

  test('laisse passer un compte ayant déjà consenti', () => {
    statut.mockReturnValue({ data: { requis: false, version: '2026-08-10' }, isLoading: false })

    const { container } = render(<ConsentementGate />)

    expect(container).toBeEmptyDOMElement()
  })

  test('bloque un compte sans consentement enregistré', () => {
    statut.mockReturnValue({ data: { requis: true, version: '2026-08-10' }, isLoading: false })

    render(<ConsentementGate />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Vos données de santé/)).toBeInTheDocument()
  })

  test('n’offre aucune fermeture silencieuse : accepter ou se déconnecter', () => {
    statut.mockReturnValue({ data: { requis: true, version: '2026-08-10' }, isLoading: false })

    render(<ConsentementGate />)

    expect(screen.queryByRole('button', { name: /fermer/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /j’accepte/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refuser/i })).toBeInTheDocument()
  })

  test('enregistre l’accord', async () => {
    statut.mockReturnValue({ data: { requis: true, version: '2026-08-10' }, isLoading: false })
    render(<ConsentementGate />)

    await userEvent.click(screen.getByRole('button', { name: /j’accepte/i }))

    expect(accepter).toHaveBeenCalled()
  })

  test('le refus déconnecte au lieu de laisser entrer', async () => {
    statut.mockReturnValue({ data: { requis: true, version: '2026-08-10' }, isLoading: false })
    render(<ConsentementGate />)

    await userEvent.click(screen.getByRole('button', { name: /refuser/i }))

    expect(logout).toHaveBeenCalled()
    expect(accepter).not.toHaveBeenCalled()
  })

  test('renvoie vers la politique de confidentialité', () => {
    statut.mockReturnValue({ data: { requis: true, version: '2026-08-10' }, isLoading: false })

    render(<ConsentementGate />)

    expect(screen.getByRole('link', { name: /politique de confidentialité/i })).toHaveAttribute(
      'href',
      '/confidentialite',
    )
  })
})
