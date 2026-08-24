import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { AgentChatResponse } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAgentConversation } from './hooks'
import type { AgentChatPayload } from './api'

const postAgentChat = vi.fn()

vi.mock('./api', () => ({
  postAgentChat: (payload: AgentChatPayload) => postAgentChat(payload),
  getAgentStatut: () => Promise.resolve({ disponible: true }),
}))

function reponse(over: Partial<AgentChatResponse> = {}): AgentChatResponse {
  return {
    conversationId: 'fil-1',
    texte: '3 cardiologues correspondent.',
    cartes: [],
    outilsAppeles: ['rechercher_medecins'],
    ...over,
  }
}

let client: QueryClient

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function setupGeolocation(resultat: 'ok' | 'refus') {
  const getCurrentPosition = vi.fn((succes, echec) => {
    if (resultat === 'ok') {
      succes({ coords: { latitude: 33.57, longitude: -7.58 } })
    } else {
      echec?.(new Error('refusé'))
    }
  })
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  })
  return getCurrentPosition
}

describe('useAgentConversation', () => {
  beforeEach(() => {
    postAgentChat.mockReset()
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  test('affiche la question du patient avant même la réponse du serveur', async () => {
    // Arrange — le serveur ne répond jamais : seul le tour local doit apparaître.
    postAgentChat.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useAgentConversation(), { wrapper })

    // Act
    await act(async () => {
      await result.current.envoyer('cardiologue à Casa')
    })

    // Assert
    expect(result.current.tours).toHaveLength(1)
    expect(result.current.tours[0]).toMatchObject({
      role: 'patient',
      texte: 'cardiologue à Casa',
    })
  })

  test('ajoute la réponse de l’assistant avec ses cartes et ses outils', async () => {
    postAgentChat.mockResolvedValue(reponse())
    const { result } = renderHook(() => useAgentConversation(), { wrapper })

    await act(async () => {
      await result.current.envoyer('cardiologue à Casa')
    })

    await waitFor(() => expect(result.current.tours).toHaveLength(2))
    expect(result.current.tours[1]).toMatchObject({
      role: 'assistant',
      texte: '3 cardiologues correspondent.',
      outils: ['rechercher_medecins'],
    })
  })

  test('réutilise l’identifiant de fil renvoyé par le tour précédent', async () => {
    postAgentChat.mockResolvedValue(reponse({ conversationId: 'fil-42' }))
    const { result } = renderHook(() => useAgentConversation(), { wrapper })

    await act(async () => {
      await result.current.envoyer('bonjour')
    })
    await waitFor(() => expect(result.current.tours).toHaveLength(2))

    await act(async () => {
      await result.current.envoyer('et ensuite ?')
    })

    await waitFor(() => expect(postAgentChat).toHaveBeenCalledTimes(2))
    expect(postAgentChat.mock.calls[0][0].conversationId).toBeNull()
    expect(postAgentChat.mock.calls[1][0].conversationId).toBe('fil-42')
  })

  test('une panne serveur devient un tour d’erreur, pas un écran vide', async () => {
    postAgentChat.mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useAgentConversation(), { wrapper })

    await act(async () => {
      await result.current.envoyer('bonjour')
    })

    await waitFor(() => expect(result.current.tours).toHaveLength(2))
    expect(result.current.tours[1].erreur).toBe(true)
    expect(result.current.tours[1].texte).not.toBe('')
  })

  test('une indisponibilité Gemini affiche le message précis du backend', async () => {
    postAgentChat.mockRejectedValue(
      new ApiError("L'assistant est momentanément indisponible.", 503)
    )
    const { result } = renderHook(() => useAgentConversation(), { wrapper })

    await act(async () => {
      await result.current.envoyer('bonjour')
    })

    await waitFor(() => expect(result.current.tours).toHaveLength(2))
    expect(result.current.tours[1].texte).toBe("L'assistant est momentanément indisponible.")
  })

  test('la géolocalisation n’est demandée que sur une question de proximité', async () => {
    const getCurrentPosition = setupGeolocation('ok')
    postAgentChat.mockResolvedValue(reponse())
    const { result } = renderHook(() => useAgentConversation(), { wrapper })

    await act(async () => {
      await result.current.envoyer('cardiologue à Casablanca')
    })

    expect(getCurrentPosition).not.toHaveBeenCalled()
    expect(postAgentChat.mock.calls[0][0].latitude).toBeNull()
  })

  test('« près de moi » transmet la position du navigateur', async () => {
    setupGeolocation('ok')
    postAgentChat.mockResolvedValue(reponse())
    const { result } = renderHook(() => useAgentConversation(), { wrapper })

    await act(async () => {
      await result.current.envoyer('un médecin près de moi')
    })

    expect(postAgentChat.mock.calls[0][0]).toMatchObject({
      latitude: 33.57,
      longitude: -7.58,
    })
  })

  test('un refus de géolocalisation n’empêche pas l’envoi', async () => {
    setupGeolocation('refus')
    postAgentChat.mockResolvedValue(reponse())
    const { result } = renderHook(() => useAgentConversation(), { wrapper })

    await act(async () => {
      await result.current.envoyer('un médecin près de moi')
    })

    expect(postAgentChat).toHaveBeenCalledTimes(1)
    expect(postAgentChat.mock.calls[0][0].latitude).toBeNull()
  })

  test('un message vide n’envoie rien', async () => {
    const { result } = renderHook(() => useAgentConversation(), { wrapper })

    await act(async () => {
      await result.current.envoyer('   ')
    })

    expect(postAgentChat).not.toHaveBeenCalled()
    expect(result.current.tours).toHaveLength(0)
  })

  test('réinitialiser vide le fil et oublie l’identifiant de conversation', async () => {
    postAgentChat.mockResolvedValue(reponse({ conversationId: 'fil-7' }))
    const { result } = renderHook(() => useAgentConversation(), { wrapper })

    await act(async () => {
      await result.current.envoyer('bonjour')
    })
    await waitFor(() => expect(result.current.tours).toHaveLength(2))

    act(() => result.current.reinitialiser())
    expect(result.current.tours).toHaveLength(0)

    await act(async () => {
      await result.current.envoyer('nouvelle question')
    })
    expect(postAgentChat.mock.calls[1][0].conversationId).toBeNull()
  })
})
