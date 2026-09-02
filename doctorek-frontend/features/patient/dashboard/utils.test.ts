import { describe, expect, test } from 'vitest'
import type { RendezVous, StatutRdv } from '@/lib/types'
import { selectDashboardRdvs } from './utils'

function rdv(
  id: string,
  dateRdv: string,
  heureRdv: string,
  statut: StatutRdv = 'CONFIRME',
): RendezVous {
  return {
    id,
    medecinId: `medecin-${id}`,
    patientId: 'patient-1',
    dateRdv,
    heureRdv,
    duree: 30,
    statut,
    motif: 'Consultation',
    createdAt: '2026-08-01T09:00:00Z',
  }
}

describe('selectDashboardRdvs', () => {
  const now = new Date(2026, 7, 26, 14, 0)

  test('ne présente jamais un créneau passé encore marqué confirmé comme prochain RDV', () => {
    const selection = selectDashboardRdvs([
      rdv('passe', '2026-08-26', '09:00'),
      rdv('demain', '2026-08-27', '10:30'),
    ], now)

    expect(selection.next?.id).toBe('demain')
    expect(selection.latestCompleted?.id).toBe('passe')
  })

  test('sélectionne le premier rendez-vous actif du jour', () => {
    const selection = selectDashboardRdvs([
      rdv('soir', '2026-08-26', '17:00'),
      rdv('apres-midi', '2026-08-26', '15:00'),
    ], now)

    expect(selection.today?.id).toBe('apres-midi')
    expect(selection.active.map((item) => item.id)).toEqual(['apres-midi', 'soir'])
  })

  test('ignore les rendez-vous annulés dans le parcours actif et l’historique de soins', () => {
    const selection = selectDashboardRdvs([
      rdv('annule', '2026-08-27', '11:00', 'ANNULE'),
      rdv('termine', '2026-08-20', '11:00', 'TERMINE'),
    ], now)

    expect(selection.active).toHaveLength(0)
    expect(selection.latestCompleted?.id).toBe('termine')
  })

  test('ne traite pas une donnée future incohérente déjà marquée terminée comme historique', () => {
    const selection = selectDashboardRdvs([
      rdv('future-terminee', '2026-08-30', '11:00', 'TERMINE'),
    ], now)

    expect(selection.latestCompleted).toBeUndefined()
  })
})
