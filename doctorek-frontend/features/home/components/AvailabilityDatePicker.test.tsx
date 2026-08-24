import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { AvailabilityDatePicker } from './AvailabilityDatePicker'

describe('AvailabilityDatePicker', () => {
  test('ouvre un calendrier moderne et applique un raccourci', () => {
    const onChange = vi.fn()
    render(
      <AvailabilityDatePicker
        variant="desktop"
        filter="all"
        date={null}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Choisir une disponibilité' }))
    expect(screen.getByRole('dialog', { name: 'Calendrier des disponibilités' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '7 jours' }))
    expect(onChange).toHaveBeenCalledWith({ filter: 'week', date: null })
  })
})
