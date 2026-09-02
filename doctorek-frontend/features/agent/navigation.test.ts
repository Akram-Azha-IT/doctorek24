import { describe, expect, test } from 'vitest'
import {
  buildAgentLoginHref,
  buildAgentReturnPath,
  removeAgentReturnMarker,
  shouldOpenAgent,
} from './navigation'

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
