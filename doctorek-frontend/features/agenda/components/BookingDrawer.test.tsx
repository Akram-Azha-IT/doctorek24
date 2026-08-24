import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import type { BookingSlot, MedecinProfile } from '@/lib/types'
import { BookingDrawer } from './BookingDrawer'
import { __setCachedSession } from '@/lib/session'

vi.mock('@/features/annuaire/components/MedecinAvatar', () => ({
  MedecinAvatar: () => <div data-testid="avatar" />,
}))
vi.mock('./ConfirmRdvForm', () => ({
  ConfirmRdvForm: () => <form data-testid="confirm-form" />,
}))

const medecin = {
  id: 'm1',
  firstName: 'Sara',
  lastName: 'Bennani',
  specialite: 'Cardiologue',
  ville: 'Rabat',
  adresse: '1 rue X',
  inpe: '123',
} as MedecinProfile

const slot: BookingSlot = { medecin, date: '2026-08-01', debut: '10:00', fin: '10:30' }

describe('BookingDrawer', () => {
  beforeEach(() => {
    act(() => __setCachedSession({ role: 'PATIENT', id: 'p1', email: 'p@x.ma' }))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  test('renders nothing without slot', () => {
    const { container } = render(<BookingDrawer slot={null} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders the drawer with doctor name for a slot', () => {
    render(<BookingDrawer slot={slot} onClose={() => {}} />)
    expect(screen.getByTestId('confirm-form')).toBeInTheDocument()
    // Le nom apparaît deux fois : récap compact mobile + carte médecin desktop.
    expect(screen.getAllByText(/Sara\s+Bennani/).length).toBeGreaterThanOrEqual(1)
  })

  test('ESC closes after the exit transition', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<BookingDrawer slot={slot} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(350))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('preserves search state in the login return URL', () => {
    act(() => __setCachedSession(null))
    render(
      <BookingDrawer
        slot={slot}
        returnUrl="/recherche?specialite=Karim&ville=Rabat&disponibilite=week&tri=nom&page=2"
        onClose={() => {}}
      />,
    )

    const loginLink = screen.getByRole('link', { name: 'Se connecter' })
    const redirect = new URL(loginLink.getAttribute('href')!, 'http://doctorek.local').searchParams.get('redirect')
    const returnPath = new URL(redirect!, 'http://doctorek.local')

    expect(returnPath.pathname).toBe('/recherche')
    expect(returnPath.searchParams.get('specialite')).toBe('Karim')
    expect(returnPath.searchParams.get('ville')).toBe('Rabat')
    expect(returnPath.searchParams.get('disponibilite')).toBe('week')
    expect(returnPath.searchParams.get('tri')).toBe('nom')
    expect(returnPath.searchParams.get('page')).toBe('2')
    expect(returnPath.searchParams.get('bookMedecinId')).toBe('m1')
    expect(returnPath.searchParams.get('bookDate')).toBe('2026-08-01')
    expect(returnPath.searchParams.get('bookDebut')).toBe('10:00')
    expect(returnPath.searchParams.get('bookFin')).toBe('10:30')
  })
})
