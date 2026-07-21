import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { NewConversationButton } from './NewConversationButton'
import { __setCachedSession } from '@/lib/session'

vi.mock('@/features/agenda/hooks', () => ({
  useRdvsPatient: () => ({ data: [], isLoading: false }),
}))
vi.mock('@/features/annuaire/hooks', () => ({
  useMedecin: () => ({ data: null }),
}))
vi.mock('../hooks', () => ({
  useConversations: () => ({ data: [], isLoading: false }),
  useStartConversation: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('NewConversationButton', () => {
  beforeEach(() => {
    act(() => __setCachedSession(null))
  })

  test('renders nothing for a doctor session', () => {
    act(() => __setCachedSession({ role: 'MEDECIN', id: 'm1', email: 'm@x.ma' }))
    const { container } = render(<NewConversationButton onStarted={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders nothing when logged out', () => {
    const { container } = render(<NewConversationButton onStarted={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  test('shows the button for a patient and opens the picker', async () => {
    act(() => __setCachedSession({ role: 'PATIENT', id: 'p1', email: 'p@x.ma' }))
    const user = userEvent.setup()
    render(<NewConversationButton onStarted={() => {}} />)
    const btn = screen.getByRole('button', { name: /Nouveau/ })
    await user.click(btn)
    // Modal ouvert — au moins un élément de plus que le bouton
    expect(document.body.textContent).not.toBe('Nouveau')
  })
})
