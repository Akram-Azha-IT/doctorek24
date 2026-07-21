import { render, screen } from '@testing-library/react'
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
  ConversationList: ({ selectedId }: { selectedId: string | null }) => (
    <div data-testid="conv-list" data-selected={selectedId ?? ''} />
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

  test('renders the list when conversations exist', () => {
    mockSearchParams.get.mockReturnValue(null)
    mockUseConversations.mockReturnValue({ data: conversations, isLoading: false })
    render(<MessagesView />)
    expect(screen.getByTestId('conv-list')).toBeInTheDocument()
    expect(screen.queryByTestId('chat')).not.toBeInTheDocument()
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
