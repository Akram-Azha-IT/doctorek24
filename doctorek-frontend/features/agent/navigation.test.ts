import { describe, expect, test } from 'vitest'
import {
  agentSurface,
  buildAgentLoginHref,
  buildAgentReturnPath,
  removeAgentReturnMarker,
  shouldOpenAgent,
} from './navigation'

describe('surface de l’assistant selon le parcours', () => {
  test.each([
    ['/dashboard/medecin', 'MEDECIN'],
    ['/dashboard/medecin/messages', 'MEDECIN'],
    ['/dashboard/admin', 'ADMIN'],
    ['/login', null],
    ['/inscription', null],
    ['/carte/VMC-2026-001', null],
    ['/dashboard/patient/messages', 'PATIENT'],
    ['/medecins/med-1/rdv', 'PATIENT'],
  ] as const)('masque l’agent sur %s pour %s', (pathname, role) => {
    expect(agentSurface(pathname, role)).toBe('masque')
  })

  test.each([
    ['/dashboard/patient', 'PATIENT'],
    ['/dashboard/patient/rdvs', 'PATIENT'],
    ['/dashboard/patient/dossier', 'PATIENT'],
    ['/recherche', 'PATIENT'],
    ['/medecins/med-1', 'PATIENT'],
    ['/recherche', null],
    ['/medecins/med-1', null],
  ] as const)('affiche un lanceur minimisé sur %s pour %s', (pathname, role) => {
    expect(agentSurface(pathname, role)).toBe('lanceur')
  })

  test('laisse les CTA de l’accueil ouvrir le panneau sans dupliquer une bulle', () => {
    expect(agentSurface('/', null)).toBe('contextuel')
  })
})

describe('navigation de retour vers l’assistant', () => {
  test('préserve la page et ses filtres dans le lien de connexion', () => {
    const returnPath = buildAgentReturnPath('/recherche', 'specialite=cardiologie&ville=Rabat')

    expect(returnPath).toBe(
      '/recherche?specialite=cardiologie&ville=Rabat&assistant=ouvert'
    )
    expect(buildAgentLoginHref(returnPath)).toBe(
      '/login?redirect=%2Frecherche%3Fspecialite%3Dcardiologie%26ville%3DRabat%26assistant%3Douvert'
    )
  })

  test('n’ajoute pas plusieurs marqueurs de retour', () => {
    expect(buildAgentReturnPath('/', 'assistant=ferme')).toBe('/?assistant=ouvert')
  })

  test('détecte puis retire uniquement le marqueur temporaire du chat', () => {
    const search = 'ville=Rabat&assistant=ouvert'

    expect(shouldOpenAgent(search)).toBe(true)
    expect(removeAgentReturnMarker('/recherche', search)).toBe('/recherche?ville=Rabat')
    expect(shouldOpenAgent('assistant=ferme')).toBe(false)
  })
})
