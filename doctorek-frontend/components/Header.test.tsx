import { render, screen, act } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { Header } from './Header'
import { __setCachedSession, type Session } from '@/lib/session'

vi.mock('@/components/Logo', () => ({
  default: () => <div data-testid="logo" />,
}))
vi.mock('@/lib/auth', () => ({
  logout: vi.fn(),
}))

const MEDECIN: Session = { role: 'MEDECIN', id: 'm1', email: 'm@x.ma', firstName: 'Sara' }
const PATIENT: Session = { role: 'PATIENT', id: 'p1', email: 'p@x.ma', firstName: 'Ali' }

describe('Header', () => {
  test('shows login link when logged out', () => {
    act(() => __setCachedSession(null))
    render(<Header />)
    expect(screen.getByText('Se connecter')).toBeInTheDocument()
  })

  test('shows medecin dashboard entry for a doctor session', () => {
    act(() => __setCachedSession(MEDECIN))
    render(<Header />)
    expect(screen.getByText('Sara')).toBeInTheDocument()
    expect(screen.getByText('Mon Agenda')).toBeInTheDocument()
    expect(screen.getByText('Sara').closest('a')).toHaveAttribute('href', '/dashboard/medecin')
  })

  test('shows patient dashboard entry for a patient session', () => {
    act(() => __setCachedSession(PATIENT))
    render(<Header />)
    expect(screen.getByText('Mes RDV')).toBeInTheDocument()
    expect(screen.getByText('Ali').closest('a')).toHaveAttribute('href', '/dashboard/patient')
  })

  test('updates live when the session changes', () => {
    act(() => __setCachedSession(null))
    render(<Header />)
    expect(screen.getByText('Se connecter')).toBeInTheDocument()
    act(() => __setCachedSession(PATIENT))
    expect(screen.queryByText('Se connecter')).not.toBeInTheDocument()
    expect(screen.getByText('Ali')).toBeInTheDocument()
  })
})
