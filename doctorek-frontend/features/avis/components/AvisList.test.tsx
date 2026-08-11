import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { Avis } from '@/lib/types'
import { AvisList } from './AvisList'

const signaler = vi.fn()

vi.mock('../hooks', () => ({
  useSignalerAvis: () => ({ mutate: signaler, isPending: false }),
}))

function avis(surcharge: Partial<Avis> = {}): Avis {
  return {
    id: 'avis-1',
    note: 4,
    commentaire: 'Explications claires',
    auteur: 'Akram B.',
    anonyme: false,
    statut: 'PUBLIE',
    createdAt: '2026-05-14T10:00:00Z',
    ...surcharge,
  }
}

describe('AvisList', () => {
  beforeEach(() => vi.clearAllMocks())

  test('affiche l’auteur, la note et le commentaire', () => {
    render(<AvisList avis={[avis()]} medecinId="med-1" />)

    expect(screen.getByText('Akram B.')).toBeInTheDocument()
    expect(screen.getByText('Explications claires')).toBeInTheDocument()
    expect(screen.getByLabelText('Note : 4 sur 5')).toBeInTheDocument()
  })

  test('chaque avis porte la mention de consultation vérifiée', () => {
    // C'est ce qui distingue Doctorek d'un site d'avis ouvert à tous.
    render(<AvisList avis={[avis()]} medecinId="med-1" />)

    expect(screen.getByText('Consultation vérifiée')).toBeInTheDocument()
  })

  test('un avis sans commentaire se limite à la note', () => {
    render(<AvisList avis={[avis({ commentaire: null })]} medecinId="med-1" />)

    expect(screen.queryByText('Explications claires')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Note : 4 sur 5')).toBeInTheDocument()
  })

  test('sans aucun avis, la liste le dit au lieu de rester vide', () => {
    render(<AvisList avis={[]} medecinId="med-1" />)

    expect(screen.getByText('Aucun avis publié pour le moment.')).toBeInTheDocument()
  })

  test('le signalement part avec l’identifiant de l’avis', async () => {
    render(<AvisList avis={[avis()]} medecinId="med-1" />)

    await userEvent.click(screen.getByRole('button', { name: /signaler cet avis/i }))

    expect(signaler).toHaveBeenCalledWith({ avisId: 'avis-1' }, expect.anything())
  })

  test('un avis déjà signalé par ce compte s’affiche comme signalé', async () => {
    // Le serveur refuse le doublon : l'intention est satisfaite, l'inviter à recommencer
    // ferait croire à un échec.
    signaler.mockImplementation((_vars, options) => options.onError(new Error('déjà signalé')))
    render(<AvisList avis={[avis()]} medecinId="med-1" />)

    await userEvent.click(screen.getByRole('button', { name: /signaler cet avis/i }))

    expect(screen.getByText(/en cours d'examen/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /signaler cet avis/i })).not.toBeInTheDocument()
  })

  test('affiche chaque avis de la liste', () => {
    render(
      <AvisList
        avis={[avis(), avis({ id: 'avis-2', auteur: 'Patient vérifié', commentaire: null })]}
        medecinId="med-1"
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
