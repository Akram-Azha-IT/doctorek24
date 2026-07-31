import { render, screen, act } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { PromoCards } from './PromoCards'

// Simulacre sans <img> : le projet réserve cette balise à un cas justifié.
vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}))

const observe = vi.fn()
const disconnect = vi.fn()
let declencher: ((entrees: unknown[]) => void) | null = null

beforeEach(() => {
  observe.mockClear()
  disconnect.mockClear()
  declencher = null
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (entrees: unknown[]) => void) {
        declencher = cb
      }
      observe = observe
      disconnect = disconnect
      unobserve = vi.fn()
      takeRecords = vi.fn()
      root = null
      rootMargin = ''
      thresholds = []
    },
  )
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
  Element.prototype.scrollIntoView = vi.fn()
})

describe('PromoCards', () => {
  test('affiche les deux offres, y compris celle des patients', () => {
    // Arrange & Act — la carte Patients était masquée sur mobile.
    render(<PromoCards />)

    // Assert
    expect(screen.getByText('Patients')).toBeInTheDocument()
    expect(screen.getByText('Médecins')).toBeInTheDocument()
  })

  test('mène vers les bonnes destinations', () => {
    render(<PromoCards />)
    const liens = screen.getAllByRole('link')
    expect(liens[0]).toHaveAttribute('href', '/login')
    expect(liens[1]).toHaveAttribute('href', '/inscription?role=medecin')
  })

  test('observe chaque carte pour situer la position', () => {
    render(<PromoCards />)
    expect(observe).toHaveBeenCalledTimes(2)
  })

  test('la pastille suit la carte la plus visible', () => {
    // Arrange
    render(<PromoCards />)
    const pastilles = screen.getAllByRole('button')
    expect(pastilles[0]).toHaveAttribute('aria-current', 'true')

    // Act — la seconde carte devient dominante.
    const cible = document.querySelector('[data-index="1"]')
    act(() => declencher?.([{ isIntersecting: true, intersectionRatio: 0.9, target: cible }]))

    // Assert
    expect(screen.getAllByRole('button')[1]).toHaveAttribute('aria-current', 'true')
  })

  test('la pastille fait défiler en douceur vers sa carte', () => {
    // Arrange
    render(<PromoCards />)

    // Act
    screen.getAllByRole('button')[1].click()

    // Assert
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth', inline: 'center' }),
    )
  })

  test('respecte le réglage mouvement réduit', () => {
    // Arrange — l'animation de défilement peut désorienter.
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    render(<PromoCards />)

    // Act
    screen.getAllByRole('button')[1].click()

    // Assert
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'auto' }),
    )
  })
})
