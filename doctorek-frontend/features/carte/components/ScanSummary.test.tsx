import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import type { CartePublic } from '@/lib/types'
import { ScanSummary } from './ScanSummary'

export const scanFixture: CartePublic = {
  id: 'card-test', patientId: 'patient-test', cardRef: 'TEST-ONLY', statut: 'VIRTUEL',
  firstName: 'Sara', lastName: 'Test', groupeSanguin: 'O+', tailleCm: 170, poidsKg: 65,
  donneurOrganes: false, allergies: [], maladiesChroniques: [], contactsUrgence: [],
  createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-09-20T10:00:00Z',
}
describe('ScanSummary', () => {
  test('shows honest empty states without a medical verification claim', () => {
    render(<ScanSummary carte={scanFixture} />)
    expect(screen.getByRole('heading', { name: 'Sara Test' })).toBeInTheDocument()
    expect(screen.getAllByText('Non renseigné')).toHaveLength(2)
    expect(screen.queryByText('Vérifiée')).not.toBeInTheDocument()
    expect(screen.queryByText('Aucune allergie connue')).not.toBeInTheDocument()
    expect(screen.getByText(/20 septembre 2026/)).toBeInTheDocument()
    expect(screen.getByText('Autres informations').closest('details')).not.toHaveAttribute('open')
  })
  test('surfaces supplied alerts and callable contacts without inventing missing data', () => {
    render(<ScanSummary carte={{ ...scanFixture, allergies: ['Latex'], maladiesChroniques: ['Condition test'], contactsUrgence: [{ nom: 'Contact test', lien: 'Proche', telephone: '+212 600 000 000' }] }} />)
    expect(screen.getByText('Latex')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Appeler Contact test' })).toHaveAttribute('href', 'tel:+212600000000')
  })
  test('does not create invalid phone links or invalid update dates', () => {
    render(<ScanSummary carte={{ ...scanFixture, updatedAt: '', contactsUrgence: [{ nom: 'Contact test', lien: 'Proche', telephone: 'indisponible' }] }} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText(/mise à jour/i)).not.toBeInTheDocument()
  })
})
