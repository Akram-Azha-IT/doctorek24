import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { AudioMessage } from './AudioMessage'

const fetchAudioObjectUrl = vi.fn()
vi.mock('../api', () => ({
  fetchAudioObjectUrl: (url: string) => fetchAudioObjectUrl(url),
}))

describe('AudioMessage', () => {
  beforeEach(() => {
    fetchAudioObjectUrl.mockReset()
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:x', revokeObjectURL: vi.fn() })
    // jsdom n'implémente pas play() — on le neutralise.
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true, value: vi.fn().mockResolvedValue(undefined),
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true, value: vi.fn(),
    })
  })

  test('affiche la durée initiale et un bouton lecture', () => {
    render(<AudioMessage mediaUrl="/x" durationSec={65} mine={false} />)
    expect(screen.getByLabelText('Lire le message vocal')).toBeInTheDocument()
    expect(screen.getByText('1:05')).toBeInTheDocument()
  })

  test('au clic, charge le blob protégé', async () => {
    fetchAudioObjectUrl.mockResolvedValue('blob:x')
    const user = userEvent.setup()
    render(<AudioMessage mediaUrl="/api/v1/messaging/messages/m1/audio" durationSec={5} mine />)
    await user.click(screen.getByLabelText('Lire le message vocal'))
    await waitFor(() =>
      expect(fetchAudioObjectUrl).toHaveBeenCalledWith('/api/v1/messaging/messages/m1/audio'),
    )
  })

  test('affiche une erreur si le chargement échoue', async () => {
    fetchAudioObjectUrl.mockRejectedValue(new Error('403'))
    const user = userEvent.setup()
    render(<AudioMessage mediaUrl="/x" durationSec={5} mine={false} />)
    await user.click(screen.getByLabelText('Lire le message vocal'))
    await waitFor(() => expect(screen.getByText('Erreur de lecture')).toBeInTheDocument())
  })
})
