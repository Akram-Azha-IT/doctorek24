import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./session', () => ({
  getSession: () => null,
  clearSession: vi.fn(),
}))

vi.mock('./auth', () => ({
  refreshAccessToken: vi.fn(),
}))

import { apiFetch, DEFAULT_API_TIMEOUT_MS } from './api-client'

describe('apiFetch multipart', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('laisse le navigateur définir le boundary Content-Type du FormData', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ success: true, data: { transcription: 'salam' }, message: null }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const body = new FormData()
    body.append('audio', new Blob(['audio'], { type: 'audio/webm' }), 'dictee.webm')
    body.append('dureeSecondes', '2.500')

    await apiFetch('/api/v1/agent/transcriptions', { method: 'POST', body })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body).toBe(body)
    expect(init.headers).not.toHaveProperty('Content-Type')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('convertit un délai dépassé en panne réseau récupérable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation timed out', 'TimeoutError')),
    )

    await expect(apiFetch('/api/v1/agenda/test')).rejects.toMatchObject({
      name: 'TypeError',
      message: 'API request timed out',
    })
  })

  it('applique un délai par défaut fini à chaque tentative', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ success: true, data: [], message: null }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/api/v1/annuaire/medecins')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(DEFAULT_API_TIMEOUT_MS).toBe(10_000)
  })
})
