import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import CarteScanPage from './page'
import * as api from '@/features/carte/api'

vi.mock('next/navigation', () => ({ useParams: () => ({ ref: 'TEST-ONLY' }) }))
vi.mock('@/lib/session', () => ({ getSession: () => null }))
vi.mock('@/components/LogoLoader', () => ({ default: () => <p>Chargement</p> }))
vi.mock('@/features/carte/api', () => ({ getCarteByRef: vi.fn(), getCarteDossier: vi.fn(), requestCarteOtp: vi.fn(), verifyCarteOtp: vi.fn(), getCarteSensible: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.getCarteByRef).mockResolvedValue({ id: 'test', patientId: 'test', cardRef: 'TEST-ONLY', statut: 'VIRTUEL', firstName: 'Sara', lastName: 'Test', allergies: [], maladiesChroniques: [], contactsUrgence: [], donneurOrganes: false, groupeSanguin: null, tailleCm: null, poidsKg: null, createdAt: '', updatedAt: '' })
})
test('public scan has one unlock action, no tabs and does not load the protected dossier', async () => {
  render(<CarteScanPage />)
  await screen.findByRole('heading', { name: 'Sara Test' })
  expect(screen.getAllByRole('button', { name: 'Demander l’accès au dossier' })).toHaveLength(1)
  expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  expect(api.getCarteDossier).not.toHaveBeenCalled()
  expect(api.getCarteSensible).not.toHaveBeenCalled()
})
test('keeps protected contents behind the existing OTP verification', async () => {
  vi.mocked(api.requestCarteOtp).mockResolvedValue({ maskedDestination: 's***@example.test', expiresInSec: 300 })
  vi.mocked(api.verifyCarteOtp).mockResolvedValue({ accessToken: 'test-grant', expiresInSec: 900 })
  vi.mocked(api.getCarteSensible).mockResolvedValue({ medicamentsActuels: [{ nom: 'Traitement test', dosage: 'Dose test' }], antecedentsChirurgicaux: [], vaccinations: [], antecedentsFamiliaux: [], medecinTraitant: null, assuranceNom: null, assuranceNumero: null, assuranceDetails: null })
  vi.mocked(api.getCarteDossier).mockResolvedValue({ ordonnances: [], documents: [] })
  render(<CarteScanPage />)
  fireEvent.click(await screen.findByRole('button', { name: 'Demander l’accès au dossier' }))
  fireEvent.change(await screen.findByRole('textbox', { name: 'Code reçu par le patient' }), { target: { value: '123456' } })
  fireEvent.click(screen.getByRole('button', { name: /débloquer/i }))
  await screen.findByText('Traitement test')
  await waitFor(() => expect(api.getCarteDossier).toHaveBeenCalledWith('TEST-ONLY', 'test-grant'))
  expect(screen.queryByRole('button', { name: 'Demander l’accès au dossier' })).not.toBeInTheDocument()
})
