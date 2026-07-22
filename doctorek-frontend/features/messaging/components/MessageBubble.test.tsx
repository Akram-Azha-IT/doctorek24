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
vi.mock('./DocumentMessage', () => ({
  DocumentMessage: ({ filename }: { filename: string }) => (
    <div data-testid="doc-card">{filename}</div>
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

  test('rend la carte document pour un message DOCUMENT', () => {
    const msg: Message = {
      ...base,
      messageType: 'DOCUMENT',
      content: null,
      mediaUrl: '/api/v1/messaging/messages/m1/media',
      mediaFilename: 'analyse.pdf',
      mediaSize: 2048,
    }
    render(<MessageBubble message={msg} isMine={false} />)
    expect(screen.getByTestId('doc-card')).toHaveTextContent('analyse.pdf')
  })

  test('affiche le reçu "Lu" quand lu et mine', () => {
    const msg: Message = { ...base, messageType: 'TEXT', content: 'x', readAt: '2026-07-21T10:01:00Z' }
    render(<MessageBubble message={msg} isMine />)
    expect(screen.getByLabelText('Lu')).toBeInTheDocument()
  })
})
