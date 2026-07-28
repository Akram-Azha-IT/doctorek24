import { render, screen, within } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { PatientFamilleList } from './PatientFamilleList'
import type { PatientSummary } from '@/lib/types'

function patient(over: Partial<PatientSummary> & { patientId: string }): PatientSummary {
  return {
    firstName: 'Momo',
    lastName: 'Mimo',
    photoUrl: null,
    gestionnaireId: null,
    gestionnaireNom: null,
    dernierRdvDate: '2026-09-03',
    dernierRdvStatut: 'CONFIRME',
    hasFutureRdv: false,
    ...over,
  }
}

const TITULAIRE = patient({ patientId: 'akram', firstName: 'Akram', lastName: 'Benhammou' })
const FILS = patient({ patientId: 'momo', gestionnaireId: 'akram', gestionnaireNom: 'Akram Benhammou' })
const FILLE = patient({
  patientId: 'sara',
  firstName: 'Sara',
  gestionnaireId: 'akram',
  gestionnaireNom: 'Akram Benhammou',
})

function setup(patients: PatientSummary[]) {
  const onOpen = vi.fn()
  render(<PatientFamilleList patients={patients} onOpen={onOpen} />)
  return { onOpen }
}

describe('PatientFamilleList', () => {
  test('annonce le nombre de proches et la séparation des dossiers', () => {
    // Arrange & Act
    setup([TITULAIRE, FILS, FILLE])

    // Assert
    expect(screen.getByText(/2 proches gérés par Akram Benhammou/)).toBeInTheDocument()
    expect(screen.getByText(/dossiers\s+médicaux distincts/)).toBeInTheDocument()
  })

  test('accorde la mention au singulier pour un proche unique', () => {
    setup([TITULAIRE, FILS])
    expect(screen.getByText(/1 proche géré par Akram Benhammou/)).toBeInTheDocument()
  })

  test('remonte le patient choisi, titulaire comme proche', () => {
    // Arrange
    const { onOpen } = setup([TITULAIRE, FILS])

    // Act
    screen.getByRole('button', { name: /Ouvrir le dossier de Momo Mimo/ }).click()
    screen.getByRole('button', { name: /Ouvrir le dossier de Akram Benhammou/ }).click()

    // Assert
    expect(onOpen).toHaveBeenNthCalledWith(1, FILS)
    expect(onOpen).toHaveBeenNthCalledWith(2, TITULAIRE)
  })

  test('affiche un proche isolé sans pied de groupe ni imbrication', () => {
    // Arrange & Act — le titulaire ne consulte pas ce médecin.
    setup([FILS])

    // Assert
    expect(screen.queryByText(/proche géré par/)).not.toBeInTheDocument()
    expect(screen.getByText('Akram Benhammou')).toBeInTheDocument()
  })

  test('garde chaque patient autonome dans son propre groupe', () => {
    // Arrange & Act
    setup([TITULAIRE, patient({ patientId: 'nadia', firstName: 'Nadia', lastName: 'Cherkaoui' })])

    // Assert
    const groupes = screen.getAllByRole('listitem').filter((li) => within(li).queryByRole('list'))
    expect(groupes).toHaveLength(2)
    expect(screen.queryByText(/proche géré par/)).not.toBeInTheDocument()
  })

  test('ne rend aucun groupe sans patient', () => {
    setup([])
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})
