import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { ConversationList } from './ConversationList'
import type { Conversation, Message } from '@/lib/types'

// La session détermine "l'autre" participant affiché.
vi.mock('@/lib/session', () => ({
  getSession: () => ({ id: 'patient-1', role: 'PATIENT', firstName: 'A', lastName: 'B' }),
}))

function makeConv(over: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    medecinId: 'med-1',
    patientId: 'patient-1',
    medecinName: 'Sara Idrissi',
    patientName: 'Ali Ben',
    lastMessageAt: new Date().toISOString(),
    createdAt: '2026-07-20T09:00:00Z',
    unreadCount: 0,
    patientCanReply: true,
    lastMessage: null,
    ...over,
  }
}

const textMsg: Message = {
  id: 'm1', conversationId: 'c1', senderId: 'med-1',
  messageType: 'TEXT', content: 'Bonjour, vos résultats sont prêts',
  sentAt: new Date().toISOString(), readAt: null,
}

describe('ConversationList', () => {
  beforeEach(() => vi.clearAllMocks())

  test('affiche un état vide quand aucune conversation', () => {
    render(<ConversationList conversations={[]} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('Aucune conversation pour le moment')).toBeInTheDocument()
  })

  test("affiche le nom de l'autre participant (médecin côté patient)", () => {
    render(<ConversationList conversations={[makeConv()]} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('Sara Idrissi')).toBeInTheDocument()
  })

  test('affiche "Nouvelle conversation" sans dernier message', () => {
    render(<ConversationList conversations={[makeConv()]} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('Nouvelle conversation')).toBeInTheDocument()
  })

  test('rend un aperçu texte du dernier message', () => {
    const conv = makeConv({ lastMessage: textMsg })
    render(<ConversationList conversations={[conv]} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('Bonjour, vos résultats sont prêts')).toBeInTheDocument()
  })

  test('rend un aperçu "Message vocal" pour un dernier message AUDIO', () => {
    const audio: Message = { ...textMsg, messageType: 'AUDIO', content: null, mediaDurationSec: 5 }
    render(<ConversationList conversations={[makeConv({ lastMessage: audio })]} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('Message vocal')).toBeInTheDocument()
  })

  test('rend le nom de fichier pour un dernier message DOCUMENT', () => {
    const doc: Message = { ...textMsg, messageType: 'DOCUMENT', content: null, mediaFilename: 'ordonnance.pdf' }
    render(<ConversationList conversations={[makeConv({ lastMessage: doc })]} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('ordonnance.pdf')).toBeInTheDocument()
  })

  test('affiche un badge de non-lus plafonné à 99+', () => {
    render(<ConversationList conversations={[makeConv({ unreadCount: 150 })]} selectedId={null} onSelect={vi.fn()} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  test('déclenche onSelect au clic', () => {
    const onSelect = vi.fn()
    const conv = makeConv()
    render(<ConversationList conversations={[conv]} selectedId={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Sara Idrissi'))
    expect(onSelect).toHaveBeenCalledWith(conv)
  })
})
