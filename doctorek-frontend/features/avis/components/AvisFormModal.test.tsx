import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { COMMENTAIRE_MAX } from '../schemas'
import { AvisFormModal } from './AvisFormModal'

const creer = vi.fn()
const onClose = vi.fn()
const onSuccess = vi.fn()

vi.mock('../hooks', () => ({
  useCreerAvis: () => ({ mutate: creer, isPending: false }),
}))

function afficher() {
  return render(
    <AvisFormModal
      rdvId="rdv-1"
      medecinId="med-1"
      medecinNom="Sara Bennani"
      onClose={onClose}
      onSuccess={onSuccess}
    />,
  )
}

describe('AvisFormModal', () => {
  beforeEach(() => vi.clearAllMocks())

  test('s’ouvre sur le nom du médecin concerné', () => {
    afficher()

    expect(screen.getByRole('dialog')).toHaveClass(
      'flex',
      'max-h-[calc(100dvh-0.75rem)]',
      'overflow-hidden',
    )
    expect(screen.getByText(/Sara Bennani/)).toBeInTheDocument()
  })

  test('garde les actions visibles dans une fenêtre mobile courte', () => {
    afficher()

    const publier = screen.getByRole('button', { name: /publier mon avis/i })
    expect(publier.parentElement).toHaveClass('sticky', 'bottom-0')
    expect(screen.getByRole('dialog').parentElement).toHaveClass('z-[80]')
  })

  test('la publication est refusée tant qu’aucune note n’est donnée', () => {
    // Le commentaire est facultatif, la note ne l'est pas.
    afficher()

    expect(screen.getByRole('button', { name: /publier mon avis/i })).toBeDisabled()
  })

  test('choisir une étoile ouvre la publication', async () => {
    afficher()

    await userEvent.click(screen.getByRole('radio', { name: /4 sur 5/ }))

    expect(screen.getByRole('button', { name: /publier mon avis/i })).toBeEnabled()
  })

  test('envoie la note, le commentaire et l’anonymat', async () => {
    afficher()

    await userEvent.click(screen.getByRole('radio', { name: /5 sur 5/ }))
    await userEvent.type(screen.getByLabelText(/commentaire/i), 'Accueil impeccable')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: /publier mon avis/i }))

    expect(creer).toHaveBeenCalledWith(
      { rdvId: 'rdv-1', note: 5, commentaire: 'Accueil impeccable', anonyme: true },
      expect.anything(),
    )
  })

  test('un commentaire laissé vide part à null, jamais en chaîne vide', async () => {
    afficher()

    await userEvent.click(screen.getByRole('radio', { name: /3 sur 5/ }))
    await userEvent.click(screen.getByRole('button', { name: /publier mon avis/i }))

    expect(creer).toHaveBeenCalledWith(
      expect.objectContaining({ commentaire: null }),
      expect.anything(),
    )
  })

  test('ferme la modale une fois l’avis enregistré', async () => {
    creer.mockImplementation((_payload, options) => options.onSuccess())
    afficher()

    await userEvent.click(screen.getByRole('radio', { name: /5 sur 5/ }))
    await userEvent.click(screen.getByRole('button', { name: /publier mon avis/i }))

    expect(onSuccess).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  test('un refus du serveur reste affiché et la modale ne se ferme pas', async () => {
    creer.mockImplementation((_payload, options) =>
      options.onError(new Error('Ce rendez-vous a déjà été noté.')),
    )
    afficher()

    await userEvent.click(screen.getByRole('radio', { name: /5 sur 5/ }))
    await userEvent.click(screen.getByRole('button', { name: /publier mon avis/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('Ce rendez-vous a déjà été noté.')
    expect(onClose).not.toHaveBeenCalled()
  })

  test('le compteur de caractères restants suit la saisie', async () => {
    afficher()

    await userEvent.type(screen.getByLabelText(/commentaire/i), 'Bien')

    expect(screen.getByText(`${COMMENTAIRE_MAX - 4} caractères restants`)).toBeInTheDocument()
  })

  test('annuler referme sans rien envoyer', async () => {
    afficher()

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(onClose).toHaveBeenCalled()
    expect(creer).not.toHaveBeenCalled()
  })

  test('cliquer à côté de la modale la referme', async () => {
    afficher()

    await userEvent.click(screen.getByRole('button', { name: /fermer sans publier/i }))

    expect(onClose).toHaveBeenCalled()
  })

  test('la touche Échap referme', async () => {
    afficher()

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })
})
