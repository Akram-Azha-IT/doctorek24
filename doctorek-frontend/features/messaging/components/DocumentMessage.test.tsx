import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { DocumentMessage } from './DocumentMessage'

const fetchAudioObjectUrl = vi.fn()
vi.mock('../api', () => ({
  fetchAudioObjectUrl: (url: string) => fetchAudioObjectUrl(url),
}))

describe('DocumentMessage', () => {
  beforeEach(() => {
    fetchAudioObjectUrl.mockReset()
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:x', revokeObjectURL: vi.fn() })
    vi.stubGlobal('open', vi.fn())
  })

  test('affiche le nom et la taille formatée', () => {
    render(<DocumentMessage mediaUrl="/x" filename="analyse.pdf" size={2048} mine={false} />)
    expect(screen.getByText('analyse.pdf')).toBeInTheDocument()
    expect(screen.getByText(/PDF · 2 Ko/)).toBeInTheDocument()
  })

  test('au clic, récupère le fichier protégé et l’ouvre', async () => {
    fetchAudioObjectUrl.mockResolvedValue('blob:x')
    const user = userEvent.setup()
    render(<DocumentMessage mediaUrl="/api/v1/messaging/messages/m1/media" filename="a.png" size={1024} mine />)
    await user.click(screen.getByLabelText('Ouvrir a.png'))
    await waitFor(() => expect(fetchAudioObjectUrl).toHaveBeenCalledWith('/api/v1/messaging/messages/m1/media'))
    expect(window.open).toHaveBeenCalled()
  })

  test('affiche une erreur si l’ouverture échoue', async () => {
    fetchAudioObjectUrl.mockRejectedValue(new Error('403'))
    const user = userEvent.setup()
    render(<DocumentMessage mediaUrl="/x" filename="a.pdf" size={512} mine={false} />)
    await user.click(screen.getByLabelText('Ouvrir a.pdf'))
    await waitFor(() => expect(screen.getByText("Erreur d'ouverture")).toBeInTheDocument())
  })
})
