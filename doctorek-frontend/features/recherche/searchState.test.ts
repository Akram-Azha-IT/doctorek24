import { describe, expect, test } from 'vitest'
import { buildRechercheUrl, readRechercheState } from './searchState'

describe('searchState', () => {
  test('restaure la recherche, les filtres, le tri et la page depuis l’URL', () => {
    const state = readRechercheState(
      new URLSearchParams(
        'specialite=Karim&ville=Rabat&disponibilite=week&date=2026-08-21&tri=nom&page=3',
      ),
    )

    expect(state).toMatchObject({
      specialite: 'Karim',
      ville: 'Rabat',
      filter: 'week',
      date: '2026-08-21',
      sort: 'nom',
      page: 3,
      nearbyMode: false,
    })
  })

  test('préserve les paramètres de réservation pendant la synchronisation', () => {
    const url = buildRechercheUrl(
      new URLSearchParams('bookMedecinId=m1&bookDate=2026-08-21'),
      {
        specialite: 'Karim',
        ville: 'Rabat',
        filter: 'today',
        date: null,
        sort: 'nom',
        nearbyMode: false,
        page: 2,
        coords: null,
      },
    )

    expect(url).toContain('bookMedecinId=m1')
    expect(url).toContain('specialite=Karim')
    expect(url).toContain('ville=Rabat')
    expect(url).toContain('disponibilite=today')
    expect(url).toContain('tri=nom')
    expect(url).toContain('page=2')
  })

  test('retire uniquement le créneau à la fermeture du panneau', () => {
    const url = buildRechercheUrl(
      new URLSearchParams(
        'specialite=Karim&ville=Rabat&bookMedecinId=m1&bookDate=2026-08-21&bookDebut=10%3A00&bookFin=10%3A30',
      ),
      {
        specialite: 'Karim',
        ville: 'Rabat',
        filter: 'week',
        date: null,
        sort: 'pertinence',
        nearbyMode: false,
        page: 1,
        coords: null,
      },
      { removeBookingParams: true },
    )

    expect(url).toBe('/recherche?specialite=Karim&ville=Rabat&disponibilite=week')
  })

  test('conserve une date exacte valide dans une URL partageable', () => {
    const url = buildRechercheUrl(
      new URLSearchParams(),
      {
        specialite: 'Dermatologie',
        ville: 'Rabat',
        filter: 'all',
        date: '2026-08-21',
        sort: 'pertinence',
        nearbyMode: false,
        page: 1,
        coords: null,
      },
    )

    expect(url).toBe('/recherche?specialite=Dermatologie&ville=Rabat&date=2026-08-21')
  })
})
