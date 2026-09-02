const FREQUENCE_CIBLE = 16_000
const OCTETS_ENTETE_WAV = 44

export interface AudioWav {
  readonly blob: Blob
  readonly dureeSecondes: number
}

function ecrireAscii(view: DataView, offset: number, texte: string) {
  for (let index = 0; index < texte.length; index += 1) {
    view.setUint8(offset + index, texte.charCodeAt(index))
  }
}

/**
 * Décode le conteneur MediaRecorder puis produit un WAV PCM mono 16 kHz.
 * Ce format est accepté nativement par Gemini et reste inférieur à 1 Mo pour 30 s.
 */
export async function convertirAudioEnWav(source: Blob): Promise<AudioWav> {
  if (typeof AudioContext === 'undefined') {
    throw new Error('AudioContext indisponible')
  }

  const contexte = new AudioContext()
  try {
    const buffer = await contexte.decodeAudioData(await source.arrayBuffer())
    const nombreEchantillons = Math.max(1, Math.round(buffer.duration * FREQUENCE_CIBLE))
    const donneesOctets = nombreEchantillons * 2
    const sortie = new ArrayBuffer(OCTETS_ENTETE_WAV + donneesOctets)
    const view = new DataView(sortie)

    ecrireAscii(view, 0, 'RIFF')
    view.setUint32(4, 36 + donneesOctets, true)
    ecrireAscii(view, 8, 'WAVE')
    ecrireAscii(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, FREQUENCE_CIBLE, true)
    view.setUint32(28, FREQUENCE_CIBLE * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    ecrireAscii(view, 36, 'data')
    view.setUint32(40, donneesOctets, true)

    const canaux = Array.from(
      { length: buffer.numberOfChannels },
      (_, canal) => buffer.getChannelData(canal),
    )
    const ratio = buffer.sampleRate / FREQUENCE_CIBLE

    for (let index = 0; index < nombreEchantillons; index += 1) {
      const position = index * ratio
      const gauche = Math.min(buffer.length - 1, Math.floor(position))
      const droite = Math.min(buffer.length - 1, gauche + 1)
      const fraction = position - gauche
      let echantillon = 0

      for (const canal of canaux) {
        echantillon += canal[gauche] + (canal[droite] - canal[gauche]) * fraction
      }
      echantillon = Math.max(-1, Math.min(1, echantillon / canaux.length))
      view.setInt16(
        OCTETS_ENTETE_WAV + index * 2,
        echantillon < 0 ? echantillon * 0x8000 : echantillon * 0x7fff,
        true,
      )
    }

    return {
      blob: new Blob([sortie], { type: 'audio/wav' }),
      dureeSecondes: buffer.duration,
    }
  } finally {
    await contexte.close()
  }
}
