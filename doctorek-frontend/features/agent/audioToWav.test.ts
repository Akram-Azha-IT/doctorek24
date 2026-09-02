import { afterEach, describe, expect, it, vi } from 'vitest'
import { convertirAudioEnWav } from './audioToWav'

describe('convertirAudioEnWav', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('produit un WAV PCM mono 16 kHz à partir de l’audio enregistré', async () => {
    const echantillons = new Float32Array(48_000).fill(0.5)
    const fermer = vi.fn().mockResolvedValue(undefined)

    class FauxAudioContext {
      decodeAudioData = vi.fn().mockResolvedValue({
        duration: 1,
        sampleRate: 48_000,
        length: 48_000,
        numberOfChannels: 1,
        getChannelData: () => echantillons,
      })

      close = fermer
    }

    vi.stubGlobal('AudioContext', FauxAudioContext)

    const resultat = await convertirAudioEnWav(new Blob([new Uint8Array([1, 2, 3])]))
    const octets = await resultat.blob.arrayBuffer()
    const vue = new DataView(octets)
    const texte = new TextDecoder().decode(octets)

    expect(resultat.dureeSecondes).toBe(1)
    expect(resultat.blob.type).toBe('audio/wav')
    expect(resultat.blob.size).toBe(44 + 16_000 * 2)
    expect(texte.slice(0, 4)).toBe('RIFF')
    expect(texte.slice(8, 12)).toBe('WAVE')
    expect(vue.getUint16(22, true)).toBe(1)
    expect(vue.getUint32(24, true)).toBe(16_000)
    expect(vue.getUint16(34, true)).toBe(16)
    expect(fermer).toHaveBeenCalledOnce()
  })
})
