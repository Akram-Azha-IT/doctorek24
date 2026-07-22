import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { sendAudioMessage, fetchAudioObjectUrl, sendAttachment, setPatientReply } from './api'
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

  test('sendAttachment POSTs the file as multipart', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 201,
      json: async () => ({ success: true, data: { id: 'd1', messageType: 'DOCUMENT' } }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const file = new File([new Uint8Array(20)], 'ordo.pdf', { type: 'application/pdf' })
    const msg = await sendAttachment('c1', file, 'cid-2')
    expect(msg.id).toBe('d1')
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toContain('/conversations/c1/attachment')
    expect((opts.body as FormData).get('file')).toBeInstanceOf(File)
  })

  test('setPatientReply calls the PUT endpoint with the flag', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ success: true, data: null }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await setPatientReply('c1', false)
    expect(fetchMock.mock.calls[0][0]).toContain('/conversations/c1/patient-reply?allowed=false')
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
