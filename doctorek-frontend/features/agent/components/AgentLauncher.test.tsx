/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AgentLauncher, type EtatAgent } from './AgentLauncher'

const postAgentTranscription = vi.fn()
const arreterPiste = vi.fn()

vi.mock('../api', () => ({
  postAgentTranscription: (...args: unknown[]) => postAgentTranscription(...args),
}))

vi.mock('../audioToWav', () => ({
  convertirAudioEnWav: () => Promise.resolve({
    blob: new Blob(['wav'], { type: 'audio/wav' }),
    dureeSecondes: 2.5,
  }),
}))

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

class FauxMediaRecorder {
  static isTypeSupported = () => true
  state: RecordingState = 'inactive'
  mimeType: string
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onerror: (() => void) | null = null
  onstop: (() => void) | null = null

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType ?? 'audio/webm'
  }

  start() { this.state = 'recording' }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['audio'], { type: this.mimeType }) })
    this.onstop?.()
  }
}

beforeEach(() => {
  arreterPiste.mockReset()
  postAgentTranscription.mockReset()
  postAgentTranscription.mockResolvedValue({
    transcription: 'Salam 3alaykom, bghit chi dentiste f Casa',
  })
  vi.stubGlobal('MediaRecorder', FauxMediaRecorder)
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: arreterPiste }],
      }),
    },
  })
})

function rendu(etat: EtatAgent, peutConverser = true, transcriptionDisponible = false) {
  const onEtendre = vi.fn()
  const onOuvrir = vi.fn()
  const onReduire = vi.fn()
  const onEnvoyer = vi.fn()
  render(
    <AgentLauncher
      etat={etat}
      onEtendre={onEtendre}
      onOuvrir={onOuvrir}
      onReduire={onReduire}
      onEnvoyer={onEnvoyer}
      enCours={false}
      peutConverser={peutConverser}
      transcriptionDisponible={transcriptionDisponible}
    />
  )
  return { onEtendre, onOuvrir, onReduire, onEnvoyer }
}

describe('AgentLauncher', () => {
  test('l’état minimisé est une orbe portant uniquement le logo', () => {
    const actions = rendu('minimise')

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: "Ouvrir l'assistant Doctorek" }))

    expect(actions.onEtendre).toHaveBeenCalledOnce()
    expect(actions.onOuvrir).not.toHaveBeenCalled()
  })

  test('cliquer dans la saisie ouvre immédiatement le panneau complet', () => {
    const actions = rendu('barre')

    fireEvent.focus(screen.getByRole('textbox', { name: 'Votre demande de santé' }))

    expect(actions.onOuvrir).toHaveBeenCalledOnce()
  })

  test('envoyer ouvre le panneau et transmet la demande', () => {
    const actions = rendu('barre')
    const champ = screen.getByRole('textbox', { name: 'Votre demande de santé' })
    fireEvent.change(champ, { target: { value: 'Cardiologue à Casablanca' } })
    fireEvent.submit(champ.closest('form')!)

    expect(actions.onOuvrir).toHaveBeenCalled()
    expect(actions.onEnvoyer).toHaveBeenCalledWith('Cardiologue à Casablanca')
  })

  test('le composeur ouvert ne duplique pas le bouton de réduction du panneau', () => {
    const actions = rendu('ouvert')

    expect(screen.queryByRole('button', { name: "Réduire l'assistant" })).not.toBeInTheDocument()
    expect(actions.onReduire).not.toHaveBeenCalled()
  })

  test('un visiteur ouvre le panneau sans pouvoir saisir ni envoyer', () => {
    const actions = rendu('barre', false)
    const champ = screen.getByRole('textbox', { name: 'Votre demande de santé' })

    expect(champ).toHaveAttribute('readonly')
    expect(champ).toHaveAttribute('placeholder', 'Connectez-vous pour commencer')
    fireEvent.focus(champ)
    fireEvent.change(champ, { target: { value: 'Dermatologue' } })
    fireEvent.submit(champ.closest('form')!)

    expect(actions.onOuvrir).toHaveBeenCalled()
    expect(actions.onEnvoyer).not.toHaveBeenCalled()
  })

  test('la dictée affiche un enregistrement puis remplit le champ sans envoyer', async () => {
    const actions = rendu('ouvert', true, true)

    fireEvent.click(screen.getByRole('button', { name: 'Démarrer la dictée vocale' }))
    expect(await screen.findByText('À l’écoute')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Arrêter et transcrire' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Arrêter et transcrire' }))

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Votre demande de santé' }))
        .toHaveValue('Salam 3alaykom, bghit chi dentiste f Casa')
    })
    expect(postAgentTranscription).toHaveBeenCalledOnce()
    expect(postAgentTranscription).toHaveBeenCalledWith(
      expect.any(Blob),
      'wav',
      expect.any(Number),
    )
    expect(actions.onEnvoyer).not.toHaveBeenCalled()
  })

  test('réduire pendant la dictée annule et libère immédiatement le micro', async () => {
    const actions = rendu('barre', true, true)

    fireEvent.click(screen.getByRole('button', { name: 'Démarrer la dictée vocale' }))
    expect(await screen.findByText('À l’écoute')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: "Réduire l'assistant" }))

    expect(actions.onReduire).toHaveBeenCalledOnce()
    expect(arreterPiste).toHaveBeenCalled()
    expect(postAgentTranscription).not.toHaveBeenCalled()
  })

  test('la dictée complète le brouillon existant au lieu de l’écraser', async () => {
    rendu('ouvert', true, true)
    fireEvent.change(screen.getByRole('textbox', { name: 'Votre demande de santé' }), {
      target: { value: 'Pour demain.' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Démarrer la dictée vocale' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Arrêter et transcrire' }))

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Votre demande de santé' }))
        .toHaveValue('Pour demain. Salam 3alaykom, bghit chi dentiste f Casa')
    })
  })

  test('libère le micro si MediaRecorder échoue après l’autorisation', async () => {
    class MediaRecorderEnErreur {
      static isTypeSupported = () => true
      constructor() {
        throw new Error('codec indisponible')
      }
    }
    vi.stubGlobal('MediaRecorder', MediaRecorderEnErreur)
    rendu('ouvert', true, true)

    fireEvent.click(screen.getByRole('button', { name: 'Démarrer la dictée vocale' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("Impossible d'accéder au microphone.")
    expect(arreterPiste).toHaveBeenCalled()
  })
})
