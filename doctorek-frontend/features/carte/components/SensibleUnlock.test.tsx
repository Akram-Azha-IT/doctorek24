import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { SensibleUnlock } from './SensibleUnlock'
import * as api from '../api'
import type { CarteSensible } from '@/lib/types'

vi.mock('../api', () => ({
  requestCarteOtp: vi.fn(),
  verifyCarteOtp: vi.fn(),
  getCarteSensible: vi.fn(),
}))

const sensible: CarteSensible = {
  medicamentsActuels: [],
  antecedentsChirurgicaux: [],
  vaccinations: [],
  antecedentsFamiliaux: [],
  medecinTraitant: null,
  assuranceNom: 'CNSS',
  assuranceNumero: '123',
  assuranceDetails: null,
}

describe('SensibleUnlock', () => {
  beforeEach(() => vi.clearAllMocks())

  test('affiche le bouton pour recevoir le code', () => {
    render(<SensibleUnlock cardRef="VMC-1" onUnlocked={vi.fn()} />)
    expect(screen.getByText('Informations protégées')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recevoir le code/i })).toBeInTheDocument()
  })

  test('envoie le code et affiche la destination masquée', async () => {
    vi.mocked(api.requestCarteOtp).mockResolvedValue({ maskedDestination: 'a***@x.ma', expiresInSec: 300 })
    render(<SensibleUnlock cardRef="VMC-1" onUnlocked={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /recevoir le code/i }))

    await waitFor(() => expect(screen.getByText('a***@x.ma')).toBeInTheDocument())
    expect(api.requestCarteOtp).toHaveBeenCalledWith('VMC-1')
  })

  test('valide le code, charge le sensible et remonte au parent', async () => {
    vi.mocked(api.requestCarteOtp).mockResolvedValue({ maskedDestination: 'a***@x.ma', expiresInSec: 300 })
    vi.mocked(api.verifyCarteOtp).mockResolvedValue({ accessToken: 'tok', expiresInSec: 900 })
    vi.mocked(api.getCarteSensible).mockResolvedValue(sensible)
    const onUnlocked = vi.fn()
    render(<SensibleUnlock cardRef="VMC-1" onUnlocked={onUnlocked} />)

    fireEvent.click(screen.getByRole('button', { name: /recevoir le code/i }))
    await waitFor(() => screen.getByText('a***@x.ma'))
    fireEvent.change(screen.getByPlaceholderText('______'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /débloquer/i }))

    await waitFor(() => expect(onUnlocked).toHaveBeenCalledWith(sensible, 'tok'))
    expect(api.verifyCarteOtp).toHaveBeenCalledWith('VMC-1', '123456')
    expect(api.getCarteSensible).toHaveBeenCalledWith('VMC-1', 'tok')
  })

  test('affiche une erreur si le code est invalide', async () => {
    vi.mocked(api.requestCarteOtp).mockResolvedValue({ maskedDestination: 'a***@x.ma', expiresInSec: 300 })
    vi.mocked(api.verifyCarteOtp).mockRejectedValue(new Error('bad'))
    render(<SensibleUnlock cardRef="VMC-1" onUnlocked={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /recevoir le code/i }))
    await waitFor(() => screen.getByText('a***@x.ma'))
    fireEvent.change(screen.getByPlaceholderText('______'), { target: { value: '000000' } })
    fireEvent.click(screen.getByRole('button', { name: /débloquer/i }))

    await waitFor(() => expect(screen.getByText(/code invalide/i)).toBeInTheDocument())
  })
})
