import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { RdvTimelineItem } from './RdvTimelineItem'
import type { RendezVous, StatutRdv } from '@/lib/types'

vi.mock('@/features/annuaire/hooks', () => ({
  useMedecin: () => ({ data: { firstName: 'Sara', lastName: 'Bennani', specialite: 'Cardiologie' } }),
}))
vi.mock('@/features/agenda/hooks', () => ({
  useCreneaux: () => ({ data: [], isLoading: false }),
  useDocumentsRequis: () => ({ data: [] }),
}))
vi.mock('@/features/annuaire/components/MedecinAvatar', () => ({
  MedecinAvatar: () => <div data-testid="avatar" />,
}))

function rdv(statut: StatutRdv): RendezVous {
  return {
    id: 'r1',
    medecinId: 'm1',
    patientId: 'p1',
    dateRdv: '2026-09-15',
    heureRdv: '10:00',
    duree: 30,
    statut,
    motif: 'Contrôle',
    createdAt: '2026-08-01T09:00:00Z',
  }
}

function setup(statut: StatutRdv = 'CONFIRME', props: Record<string, unknown> = {}) {
  const onAnnuler = vi.fn()
  render(
    <RdvTimelineItem
      rdv={rdv(statut)}
      isReprogramming={false}
      onReprogrammer={vi.fn()}
      onAnnuler={onAnnuler}
      {...props}
    />,
  )
  return { onAnnuler }
}

const cancelButton = () => screen.getByRole('button', { name: /^annuler$/i })

describe('RdvTimelineItem — annulation', () => {
  beforeEach(() => vi.clearAllMocks())

  test('propose l’annulation sur un rendez-vous à venir', () => {
    setup('CONFIRME')
    expect(cancelButton()).toBeInTheDocument()
  })

  test('demande confirmation avant d’annuler', () => {
    const { onAnnuler } = setup('CONFIRME')

    fireEvent.click(cancelButton())

    expect(screen.getByText(/annuler ce rendez-vous/i)).toBeInTheDocument()
    expect(onAnnuler).not.toHaveBeenCalled()
  })

  test('annule après confirmation', () => {
    const { onAnnuler } = setup('CONFIRME')
    fireEvent.click(cancelButton())

    fireEvent.click(screen.getByRole('button', { name: /oui, annuler/i }))

    expect(onAnnuler).toHaveBeenCalledWith('r1')
  })

  test('renonce sans rien annuler', () => {
    const { onAnnuler } = setup('CONFIRME')
    fireEvent.click(cancelButton())

    fireEvent.click(screen.getByRole('button', { name: /^non$/i }))

    expect(onAnnuler).not.toHaveBeenCalled()
    expect(cancelButton()).toBeInTheDocument()
  })

  test('ne propose pas d’annuler un rendez-vous déjà annulé', () => {
    setup('ANNULE')
    expect(screen.queryByRole('button', { name: /^annuler$/i })).not.toBeInTheDocument()
  })

  test('ne propose pas d’annuler un rendez-vous terminé', () => {
    setup('TERMINE')
    expect(screen.queryByRole('button', { name: /^annuler$/i })).not.toBeInTheDocument()
  })

  test('masque l’action quand le parent ne la gère pas', () => {
    render(
      <RdvTimelineItem rdv={rdv('CONFIRME')} isReprogramming={false} onReprogrammer={vi.fn()} />,
    )
    expect(screen.queryByRole('button', { name: /^annuler$/i })).not.toBeInTheDocument()
  })

  test('verrouille le bouton pendant l’annulation', () => {
    setup('CONFIRME', { isCancelling: true })
    expect(cancelButton()).toBeDisabled()
  })
})
