import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import LogoLoader from './LogoLoader'

describe('LogoLoader', () => {
  test('annonce le chargement avec le mot-symbole', () => {
    render(<LogoLoader label="Chargement du profil…" />)

    expect(screen.getByRole('status', { name: 'Chargement du profil…' })).toBeInTheDocument()
    expect(screen.getByText('Chargement du profil…')).toBeInTheDocument()
  })

  test('fournit une variante compacte de marque pour les actions', () => {
    const { container } = render(<LogoLoader variant="mark" size={16} inverse decorative />)
    const mark = container.firstElementChild

    expect(mark).toHaveClass('logo-loader-mark', 'logo-loader-mark--inverse')
    expect(mark).toHaveStyle({ '--ll-size': '16px' })
    expect(mark).toHaveAttribute('aria-hidden', 'true')
  })
})
