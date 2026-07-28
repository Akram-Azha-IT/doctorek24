import { describe, expect, test } from 'vitest'
import { groupPatientsByFamille } from './patients-famille'
import type { PatientSummary } from '@/lib/types'

function patient(over: Partial<PatientSummary> & { patientId: string }): PatientSummary {
  return {
    firstName: 'Momo',
    lastName: 'Mimo',
    photoUrl: null,
    gestionnaireId: null,
    gestionnaireNom: null,
    dernierRdvDate: '2026-07-01',
    dernierRdvStatut: 'TERMINE',
    hasFutureRdv: false,
    ...over,
  }
}

describe('groupPatientsByFamille', () => {
  test('regroupe les proches sous leur titulaire quand il est patient du médecin', () => {
    // Arrange
    const titulaire = patient({ patientId: 'akram', firstName: 'Akram', lastName: 'Benhammou' })
    const fils = patient({ patientId: 'momo', gestionnaireId: 'akram', gestionnaireNom: 'Akram Benhammou' })
    const fille = patient({ patientId: 'sara', firstName: 'Sara', gestionnaireId: 'akram', gestionnaireNom: 'Akram Benhammou' })

    // Act
    const groupes = groupPatientsByFamille([titulaire, fils, fille])

    // Assert
    expect(groupes).toHaveLength(1)
    expect(groupes[0].titulaire?.patientId).toBe('akram')
    expect(groupes[0].proches.map((p) => p.patientId)).toEqual(['momo', 'sara'])
    expect(groupes[0].titulaireNom).toBe('Akram Benhammou')
  })

  test('garde le nom du titulaire même lorsque celui-ci ne consulte pas ce médecin', () => {
    // Arrange
    const fils = patient({ patientId: 'momo', gestionnaireId: 'akram', gestionnaireNom: 'Akram Benhammou' })

    // Act
    const groupes = groupPatientsByFamille([fils])

    // Assert
    expect(groupes).toHaveLength(1)
    expect(groupes[0].titulaire).toBeNull()
    expect(groupes[0].titulaireNom).toBe('Akram Benhammou')
    expect(groupes[0].proches).toHaveLength(1)
  })

  test('laisse chaque patient autonome dans son propre groupe', () => {
    // Arrange
    const a = patient({ patientId: 'a' })
    const b = patient({ patientId: 'b' })

    // Act
    const groupes = groupPatientsByFamille([a, b])

    // Assert
    expect(groupes.map((g) => g.key)).toEqual(['a', 'b'])
    expect(groupes.every((g) => g.proches.length === 0)).toBe(true)
  })

  test('rattache le proche listé avant son titulaire', () => {
    // Arrange — la pagination peut renvoyer le proche en premier.
    const fils = patient({ patientId: 'momo', gestionnaireId: 'akram', gestionnaireNom: 'Akram Benhammou' })
    const titulaire = patient({ patientId: 'akram', firstName: 'Akram' })

    // Act
    const groupes = groupPatientsByFamille([fils, titulaire])

    // Assert
    expect(groupes).toHaveLength(1)
    expect(groupes[0].titulaire?.patientId).toBe('akram')
  })

  test('retourne une liste vide sans patient', () => {
    expect(groupPatientsByFamille([])).toEqual([])
  })
})
