import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { PatientListItem } from './PatientListItem'
import type { PatientSummary } from '@/lib/types'

function patient(over: Partial<PatientSummary> = {}): PatientSummary {
  return {
    patientId: 'p1',
    firstName: 'Momo',
    lastName: 'Mimo',
    photoUrl: null,
    gestionnaireId: null,
    gestionnaireNom: null,
    dernierRdvDate: '2026-09-03',
    dernierRdvStatut: 'CONFIRME',
    hasFutureRdv: true,
    ...over,
  }
}

function setup(over: Partial<PatientSummary> = {}, nested = false) {
  const onClick = vi.fn()
  render(<PatientListItem patient={patient(over)} onClick={onClick} nested={nested} />)
  return { onClick }
}

describe('PatientListItem', () => {
  test('nomme le titulaire quand le proche est affiché hors de son groupe', () => {
    // Arrange & Act — le titulaire ne consulte pas ce médecin.
    setup({ gestionnaireId: 'akram', gestionnaireNom: 'Akram Benhammou' })

    // Assert
    expect(screen.getByText('Akram Benhammou')).toBeInTheDocument()
  })

  test('omet la mention quand le proche est déjà imbriqué sous son titulaire', () => {
    // Arrange & Act
    setup({ gestionnaireId: 'akram', gestionnaireNom: 'Akram Benhammou' }, true)

    // Assert — le filet de rattachement porte déjà l'information.
    expect(screen.queryByText('Akram Benhammou')).not.toBeInTheDocument()
  })

  test('ouvre le dossier au clic', () => {
    // Arrange
    const { onClick } = setup()

    // Act
    screen.getByRole('button', { name: /Ouvrir le dossier de Momo Mimo/ }).click()

    // Assert
    expect(onClick).toHaveBeenCalledOnce()
  })
})
