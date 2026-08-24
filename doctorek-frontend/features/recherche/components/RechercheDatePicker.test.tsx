import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { RechercheDatePicker } from './RechercheDatePicker'

describe('RechercheDatePicker', () => {
  test('ouvre le calendrier et applique une période rapide', () => {
    const onChange = vi.fn()
    render(<RechercheDatePicker filter="all" date={null} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Choisir la date de consultation' }))
    expect(screen.getByRole('dialog', { name: 'Calendrier des disponibilités' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '7 jours' }))
    expect(onChange).toHaveBeenCalledWith({ filter: 'week', date: null })
  })

  test('affiche une date exacte dans le contrôle', () => {
    render(<RechercheDatePicker filter="all" date="2026-08-24" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Choisir la date de consultation' })).toHaveTextContent(/24 août/i)
  })
})
