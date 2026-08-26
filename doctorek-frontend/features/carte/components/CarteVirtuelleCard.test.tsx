import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import CarteVirtuelleCard, { CarteRecto } from './CarteVirtuelleCard'
import type { CarteVirtuelle } from '@/lib/types'
import { getGoogleWalletSaveUrl } from '@/features/carte/api'

const toDataURL = vi.fn(async () => 'data:image/png;base64,QR')
vi.mock('qrcode', () => ({
  default: { toDataURL: (...a: unknown[]) => toDataURL(...a) },
}))
vi.mock('./CarteVirtuelleExport', () => ({
  buildRectoSvg: (...args: unknown[]) => `<svg data-args="${args.length}"></svg>`,
  buildVersoSvg: () => '<svg></svg>',
}))
vi.mock('@/features/carte/api', () => ({
  getGoogleWalletSaveUrl: vi.fn(),
}))

const carte = {
  id: 'c1',
  patientId: 'p1',
  cardRef: 'REF123',
  statut: 'VIRTUEL',
  firstName: 'Ali',
  lastName: 'Idrissi',
  assuranceNumero: 'CNSS-42',
} as CarteVirtuelle

describe('CarteRecto', () => {
  test('renders the recto SVG', () => {
    const { container } = render(
      <CarteRecto carte={carte} firstName="Ali" lastName="Idrissi" />,
    )
    expect(container.querySelector('svg')).not.toBeNull()
    expect(toDataURL).not.toHaveBeenCalled()
  })

  test('generates a QR code when qrUrl is provided', async () => {
    render(
      <CarteRecto carte={carte} firstName="Ali" lastName="Idrissi" qrUrl="https://x/carte/REF123" />,
    )
    await waitFor(() => expect(toDataURL).toHaveBeenCalledWith(
      'https://x/carte/REF123',
      expect.objectContaining({ width: 192 }),
    ))
  })

  test('opens Google Wallet in a new tab without leaving Doctorek', async () => {
    const replace = vi.fn()
    const close = vi.fn()
    const walletWindow = {
      opener: window,
      location: { replace },
      close,
    } as unknown as Window
    const open = vi.spyOn(window, 'open').mockReturnValue(walletWindow)
    vi.mocked(getGoogleWalletSaveUrl).mockResolvedValue({
      saveUrl: 'https://pay.google.com/gp/v/save/test-token',
    })

    render(<CarteVirtuelleCard carte={carte} firstName="Ali" lastName="Idrissi" />)
    fireEvent.click(screen.getByRole('button', { name: /ajouter à google wallet/i }))

    expect(open).toHaveBeenCalledWith('about:blank', '_blank')
    await waitFor(() => expect(replace).toHaveBeenCalledWith(
      'https://pay.google.com/gp/v/save/test-token',
    ))
    expect(close).not.toHaveBeenCalled()
  })
})
