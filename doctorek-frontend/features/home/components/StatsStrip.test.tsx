import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { StatsStrip } from './StatsStrip'

describe('StatsStrip', () => {
  test('présente le parcours en trois étapes sans statistiques non vérifiées', () => {
    render(<StatsStrip />)

    expect(screen.getByText('Décrivez')).toBeInTheDocument()
    expect(screen.getByText('Comparez')).toBeInTheDocument()
    expect(screen.getByText('Réservez')).toBeInTheDocument()
    expect(screen.queryByText(/50 000|2 000|24\/7/)).not.toBeInTheDocument()
  })
})
