import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { sendAudioMessage, fetchAudioObjectUrl } from './api'
import { __setCachedSession } from '@/lib/session'

describe('messaging audio api', () => {
  beforeEach(() => {
    __setCachedSession({ role: 'PATIENT', id: 'p1', email: 'p@x.ma', accessToken: 'tok' })
  })
  afterEach(() => vi.restoreAllMocks())

  test('sendAudioMessage POSTs multipart with auth + returns data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: { id: 'm1', messageType: 'AUDIO' } }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const blob = new Blob([new Uint8Array(10)], { type: 'audio/webm' })
    const msg = await sendAudioMessage('c1', blob, 12, 'cid-1')

    expect(msg.id).toBe('m1')
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/messaging/conversations/c1/audio')
    expect(opts.method).toBe('POST')
    expect(opts.headers.Authorization).toBe('Bearer tok')
    expect(opts.body).toBeInstanceOf(FormData)
    expect((opts.body as FormData).get('durationSec')).toBe('12')
  })

  test('sendAudioMessage throws on error envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 400,
      json: async () => ({ success: false, message: 'Durée invalide' }),
    }))
    const blob = new Blob([new Uint8Array(1)], { type: 'audio/webm' })
    await expect(sendAudioMessage('c1', blob, 200, 'cid')).rejects.toThrow('Durée invalide')
  })

  test('fetchAudioObjectUrl fetches with auth and returns object URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, blob: async () => new Blob(['x']),
    }))
    const createSpy = vi.fn().mockReturnValue('blob:fake')
    vi.stubGlobal('URL', { ...URL, createObjectURL: createSpy })

    const url = await fetchAudioObjectUrl('/api/v1/messaging/messages/m1/audio')
    expect(url).toBe('blob:fake')
    expect(createSpy).toHaveBeenCalled()
  })
})
