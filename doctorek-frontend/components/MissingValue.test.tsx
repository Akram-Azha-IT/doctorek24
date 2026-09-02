import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { MissingValue } from './MissingValue'

describe('MissingValue', () => {
  test.each([null, undefined, '', '   '])('rend une absence explicite pour %s', (value) => {
    const { container } = render(<MissingValue value={value} fallback="Ville non renseignée" />)

    expect(screen.getByText('Ville non renseignée')).toBeInTheDocument()
    expect(container.querySelector('[data-state="missing"]')).toBeInTheDocument()
  })

  test('préserve une valeur disponible', () => {
    const { container } = render(<MissingValue value="Mohammedia" />)

    expect(screen.getByText('Mohammedia')).toBeInTheDocument()
    expect(container.querySelector('[data-state="missing"]')).not.toBeInTheDocument()
  })
})
