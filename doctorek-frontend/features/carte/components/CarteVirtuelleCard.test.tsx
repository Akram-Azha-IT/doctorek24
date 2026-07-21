import { render, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { CarteRecto } from './CarteVirtuelleCard'
import type { CarteVirtuelle } from '@/lib/types'

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
})
