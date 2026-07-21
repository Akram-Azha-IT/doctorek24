import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { useAudioRecorder } from './useAudioRecorder'

// Fake MediaRecorder — jsdom n'en fournit pas.
class FakeMediaRecorder {
  static isTypeSupported = () => true
  state: 'inactive' | 'recording' = 'inactive'
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  constructor(public stream: MediaStream, public opts: { mimeType: string }) {}
  start() { this.state = 'recording' }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob([new Uint8Array(4)], { type: 'audio/webm' }) })
    this.onstop?.()
  }
}

const track = { stop: vi.fn() }
const fakeStream = { getTracks: () => [track] } as unknown as MediaStream

beforeEach(() => {
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder)
  vi.stubGlobal('navigator', {
    ...navigator,
    mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(fakeStream) },
  })
})
afterEach(() => vi.restoreAllMocks())

describe('useAudioRecorder', () => {
  test('start passe en recording', async () => {
    const { result } = renderHook(() => useAudioRecorder())
    await act(async () => { await result.current.start() })
    expect(result.current.state).toBe('recording')
  })

  test('stop renvoie blob + durée et revient à idle', async () => {
    const { result } = renderHook(() => useAudioRecorder())
    await act(async () => { await result.current.start() })

    let rec: { blob: Blob; durationSec: number } | null = null
    await act(async () => { rec = await result.current.stop() })

    expect(rec).not.toBeNull()
    expect(rec!.durationSec).toBeGreaterThanOrEqual(1)
    expect(result.current.state).toBe('idle')
    expect(track.stop).toHaveBeenCalled()
  })

  test('cancel réinitialise sans erreur', async () => {
    const { result } = renderHook(() => useAudioRecorder())
    await act(async () => { await result.current.start() })
    act(() => result.current.cancel())
    expect(result.current.state).toBe('idle')
    expect(result.current.elapsed).toBe(0)
  })

  test('micro refusé → état error', async () => {
    ;(navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('denied'))
    const { result } = renderHook(() => useAudioRecorder())
    await act(async () => { await result.current.start() })
    await waitFor(() => expect(result.current.state).toBe('error'))
    expect(result.current.error).toBeTruthy()
  })
})
