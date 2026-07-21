import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { MessageBubble } from './MessageBubble'
import type { Message } from '@/lib/types'

// AudioMessage importe l'API (fetch) — on le stub pour un rendu isolé.
vi.mock('./AudioMessage', () => ({
  AudioMessage: ({ durationSec }: { durationSec: number }) => (
    <div data-testid="audio-player">audio {durationSec}s</div>
  ),
}))

const base = {
  id: 'm1',
  conversationId: 'c1',
  senderId: 's1',
  sentAt: '2026-07-21T10:00:00Z',
  readAt: null,
}

describe('MessageBubble', () => {
  test('rend le texte pour un message TEXT', () => {
    const msg: Message = { ...base, messageType: 'TEXT', content: 'Bonjour docteur' }
    render(<MessageBubble message={msg} isMine={false} />)
    expect(screen.getByText('Bonjour docteur')).toBeInTheDocument()
    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument()
  })

  test('rend le lecteur audio pour un message AUDIO', () => {
    const msg: Message = {
      ...base,
      messageType: 'AUDIO',
      content: null,
      mediaUrl: '/api/v1/messaging/messages/m1/audio',
      mediaDurationSec: 8,
    }
    render(<MessageBubble message={msg} isMine />)
    expect(screen.getByTestId('audio-player')).toHaveTextContent('audio 8s')
  })

  test('affiche le double-check quand lu et mine', () => {
    const msg: Message = { ...base, messageType: 'TEXT', content: 'x', readAt: '2026-07-21T10:01:00Z' }
    render(<MessageBubble message={msg} isMine />)
    expect(screen.getByText('✓✓')).toBeInTheDocument()
  })
})
