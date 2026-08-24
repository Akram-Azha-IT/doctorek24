import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { PromoCards } from './PromoCards'

// Simulacre sans <img> : le projet réserve cette balise à un cas justifié.
vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}))

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

  test('regroupe les offres dans une section clairement nommée', () => {
    render(<PromoCards />)
    expect(
      screen.getByLabelText('Doctorek pour les patients et pour les médecins'),
    ).toBeInTheDocument()
  })

  test('décrit les deux visuels produit', () => {
    render(<PromoCards />)
    expect(
      screen.getByRole('img', {
        name: 'Carte médicale Doctorek affichée sur un smartphone',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Application Doctorek sur smartphone' }),
    ).toBeInTheDocument()
  })

  test('affiche directement les deux offres sans contrôle de carrousel', () => {
    render(<PromoCards />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
