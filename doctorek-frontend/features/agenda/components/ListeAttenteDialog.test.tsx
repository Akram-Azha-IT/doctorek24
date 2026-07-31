import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { ListeAttenteDialog } from './ListeAttenteDialog'

const useListeAttente = vi.fn()
const rejoindre = vi.fn()

vi.mock('@/features/agenda/hooks', () => ({
  useListeAttente: (patientId: string) => useListeAttente(patientId),
  useRejoindreListeAttente: () => ({ mutate: rejoindre, isPending: false, isError: false }),
  useQuitterListeAttente: () => ({ mutate: vi.fn(), isPending: false }),
}))

const MEDECIN = 'med-1'
const PATIENT = 'pat-1'

function setup(patientId: string | null = PATIENT) {
  const onClose = vi.fn()
  useListeAttente.mockReturnValue({ data: [] })
  render(
    <ListeAttenteDialog
      medecinId={MEDECIN}
      patientId={patientId}
      medecinNom="Dr. Hakim Tazi"
      returnUrl="/recherche"
      onClose={onClose}
    />,
  )
  return { onClose }
}

describe('ListeAttenteDialog', () => {
  beforeEach(() => {
    rejoindre.mockClear()
    useListeAttente.mockReset()
  })

  test('nomme le médecin concerné', () => {
    setup()
    expect(screen.getByText('Dr. Hakim Tazi')).toBeInTheDocument()
  })

  test('se ferme au bouton', () => {
    // Arrange
    const { onClose } = setup()

    // Act
    screen.getByRole('button', { name: 'Fermer' }).click()

    // Assert
    expect(onClose).toHaveBeenCalled()
  })

  test('se ferme avec la touche Échap', () => {
    // Arrange — sortie clavier obligatoire pour une fenêtre modale.
    const { onClose } = setup()

    // Act
    fireEvent.keyDown(document, { key: 'Escape' })

    // Assert
    expect(onClose).toHaveBeenCalled()
  })

  test('invite à se connecter en gardant le retour vers la recherche', () => {
    // Arrange & Act — le visiteur non connecté ne doit pas perdre ses résultats.
    setup(null)

    // Assert
    const lien = screen.getByRole('link', { name: 'Se connecter' })
    expect(lien).toHaveAttribute('href', '/login?redirect=%2Frecherche')
    expect(screen.queryByRole('button', { name: 'Me prévenir' })).not.toBeInTheDocument()
  })

  test('ferme la fenêtre une fois l’inscription réussie', () => {
    // Arrange
    const { onClose } = setup()

    // Act
    screen.getByRole('button', { name: 'Me prévenir' }).click()
    const options = rejoindre.mock.calls[0][1] as { onSuccess: () => void }
    options.onSuccess()

    // Assert
    expect(onClose).toHaveBeenCalled()
  })
})
