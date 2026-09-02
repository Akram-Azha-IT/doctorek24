import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import type { Conversation } from '@/lib/types'
import { MessagesView } from './MessagesView'

const mockSearchParams = { get: vi.fn<(k: string) => string | null>() }
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}))

const conversations: Conversation[] = [
  { id: 'c1', medecinName: 'Dr Amine', patientName: 'Ali' } as unknown as Conversation,
  { id: 'c2', medecinName: 'Dr Sara', patientName: 'Ali' } as unknown as Conversation,
]
const mockUseConversations = vi.fn()
vi.mock('../hooks', () => ({
  useConversations: () => mockUseConversations(),
}))

vi.mock('./ConversationList', () => ({
  ConversationList: ({
    selectedId,
    conversations: visibleConversations,
  }: {
    selectedId: string | null
    conversations: Conversation[]
  }) => (
    <div
      data-testid="conv-list"
      data-selected={selectedId ?? ''}
      data-count={visibleConversations.length}
    />
  ),
}))
vi.mock('./ChatWindow', () => ({
  ChatWindow: ({ conversation }: { conversation: Conversation }) => (
    <div data-testid="chat" data-conv={conversation.id} />
  ),
}))
vi.mock('./NewConversationButton', () => ({
  NewConversationButton: () => <button type="button">new</button>,
}))

describe('MessagesView', () => {
  beforeEach(() => {
    mockSearchParams.get.mockReset()
    mockUseConversations.mockReset()
  })

  test('shows empty state without conversations', () => {
    mockSearchParams.get.mockReturnValue(null)
    mockUseConversations.mockReturnValue({ data: [], isLoading: false })
    render(<MessagesView />)
    expect(screen.getByText('Aucune conversation')).toBeInTheDocument()
  })

  test('selects the first conversation when the list loads', () => {
    mockSearchParams.get.mockReturnValue(null)
    mockUseConversations.mockReturnValue({ data: conversations, isLoading: false })
    render(<MessagesView />)
    expect(screen.getByTestId('conv-list')).toBeInTheDocument()
    expect(screen.getByTestId('chat')).toHaveAttribute('data-conv', 'c1')
  })

  test('filters conversations from the search field', () => {
    mockSearchParams.get.mockReturnValue(null)
    mockUseConversations.mockReturnValue({ data: conversations, isLoading: false })
    render(<MessagesView />)

    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher dans les messages' }), {
      target: { value: 'Sara' },
    })

    expect(screen.getByTestId('conv-list')).toHaveAttribute('data-count', '1')
  })

  test('deep link ?conv= selects the matching conversation', () => {
    mockSearchParams.get.mockImplementation((k) => (k === 'conv' ? 'c2' : null))
    mockUseConversations.mockReturnValue({ data: conversations, isLoading: false })
    render(<MessagesView />)
    expect(screen.getByTestId('chat')).toHaveAttribute('data-conv', 'c2')
  })

  test('unknown ?conv= id selects nothing', () => {
    mockSearchParams.get.mockImplementation((k) => (k === 'conv' ? 'nope' : null))
    mockUseConversations.mockReturnValue({ data: conversations, isLoading: false })
    render(<MessagesView />)
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument()
  })
})
