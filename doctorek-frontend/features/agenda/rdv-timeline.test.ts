import { describe, expect, test } from 'vitest'
import { statutAffiche } from './rdv-timeline'
import type { RendezVous, StatutRdv } from '@/lib/types'

function rdv(statut: StatutRdv, dateRdv: string, heureRdv: string, duree = 30): RendezVous {
  return {
    id: 'r1',
    medecinId: 'm1',
    patientId: 'p1',
    dateRdv,
    heureRdv,
    duree,
    statut,
    motif: null,
    createdAt: '2026-08-01T09:00:00Z',
  }
}

const MAINTENANT = new Date(2026, 7, 10, 14, 30) // 10 août 2026, 14 h 30

describe('statutAffiche', () => {
  test('un créneau écoulé se lit « terminé » même si le serveur dit encore « confirmé »', () => {
    expect(statutAffiche(rdv('CONFIRME', '2026-08-09', '10:00'), MAINTENANT)).toBe('TERMINE')
  })

  test('un rendez-vous jamais confirmé et déjà passé se lit aussi « terminé »', () => {
    expect(statutAffiche(rdv('EN_ATTENTE', '2026-08-09', '10:00'), MAINTENANT)).toBe('TERMINE')
  })

  test('la consultation en cours reste confirmée jusqu’à la fin du créneau', () => {
    // Commencée à 14 h 15 pour 30 minutes : elle court encore à 14 h 30.
    expect(statutAffiche(rdv('CONFIRME', '2026-08-10', '14:15'), MAINTENANT)).toBe('CONFIRME')
  })

  test('la fin du créneau bascule le statut, pas son début', () => {
    // Commencée à 13 h 50 pour 30 minutes : terminée depuis 14 h 20.
    expect(statutAffiche(rdv('CONFIRME', '2026-08-10', '13:50'), MAINTENANT)).toBe('TERMINE')
  })

  test('un rendez-vous à venir garde son statut', () => {
    expect(statutAffiche(rdv('CONFIRME', '2026-08-11', '09:00'), MAINTENANT)).toBe('CONFIRME')
  })

  test('un rendez-vous annulé le reste, l’heure passée n’y change rien', () => {
    expect(statutAffiche(rdv('ANNULE', '2026-08-09', '10:00'), MAINTENANT)).toBe('ANNULE')
  })
})
