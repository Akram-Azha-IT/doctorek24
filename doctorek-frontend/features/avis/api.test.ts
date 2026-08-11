import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  creerAvis,
  getAvisMedecin,
  getFileModeration,
  getNotesMedecins,
  getRdvsNotables,
  modererAvis,
  signalerAvis,
} from './api'

const apiFetch = vi.fn()
vi.mock('@/lib/api-client', () => ({ apiFetch: (...args: unknown[]) => apiFetch(...args) }))

function urlAppelee(): string {
  return apiFetch.mock.calls[0][0] as string
}

function optionsAppelees(): { method?: string; body?: string } {
  return (apiFetch.mock.calls[0][1] ?? {}) as { method?: string; body?: string }
}

describe('api des avis', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    apiFetch.mockResolvedValue(undefined)
  })

  test('la liste des avis d’un médecin est paginée', async () => {
    await getAvisMedecin('med-1', 3, 5)

    expect(urlAppelee()).toBe('/api/v1/annuaire/medecins/med-1/avis?page=3&size=5')
  })

  test('la première page est demandée par défaut', async () => {
    await getAvisMedecin('med-1')

    expect(urlAppelee()).toContain('page=1')
  })

  test('les notes de toute une page de résultats tiennent en un seul appel', async () => {
    await getNotesMedecins(['m1', 'm2', 'm3'])

    expect(apiFetch).toHaveBeenCalledTimes(1)
    expect(urlAppelee()).toBe('/api/v1/avis/notes?ids=m1%2Cm2%2Cm3')
  })

  test('le dépôt d’avis transmet la note et l’anonymat', async () => {
    await creerAvis({ rdvId: 'rdv-1', note: 4, commentaire: 'Très à l’écoute', anonyme: true })

    expect(urlAppelee()).toBe('/api/v1/avis')
    expect(optionsAppelees().method).toBe('POST')
    expect(JSON.parse(optionsAppelees().body as string)).toEqual({
      rdvId: 'rdv-1',
      note: 4,
      commentaire: 'Très à l’écoute',
      anonyme: true,
    })
  })

  test('les rendez-vous notables partent en POST, jamais dans l’URL', async () => {
    // Une liste d'identifiants de rendez-vous n'a rien à faire dans les journaux du serveur.
    await getRdvsNotables(['rdv-1', 'rdv-2'])

    expect(urlAppelee()).toBe('/api/v1/avis/notables')
    expect(optionsAppelees().method).toBe('POST')
    expect(JSON.parse(optionsAppelees().body as string)).toEqual({ rdvIds: ['rdv-1', 'rdv-2'] })
  })

  test('un signalement sans motif envoie null plutôt que rien', async () => {
    await signalerAvis('avis-1')

    expect(urlAppelee()).toBe('/api/v1/avis/avis-1/signalement')
    expect(JSON.parse(optionsAppelees().body as string)).toEqual({ motif: null })
  })

  test('un signalement motivé transmet le motif', async () => {
    await signalerAvis('avis-1', 'Propos injurieux')

    expect(JSON.parse(optionsAppelees().body as string)).toEqual({ motif: 'Propos injurieux' })
  })

  test('la file de modération est paginée', async () => {
    await getFileModeration(2, 20)

    expect(urlAppelee()).toBe('/api/v1/avis/moderation?page=2&size=20')
  })

  test('la décision de modération passe en PUT', async () => {
    await modererAvis('avis-1', 'MASQUE')

    expect(urlAppelee()).toBe('/api/v1/avis/avis-1/moderation?statut=MASQUE')
    expect(optionsAppelees().method).toBe('PUT')
  })
})
