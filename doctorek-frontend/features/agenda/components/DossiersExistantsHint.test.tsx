import { render, screen, act } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { DossiersExistantsHint } from './DossiersExistantsHint'
import type { PatientSummary } from '@/lib/types'

const usePatientsMedecin = vi.fn()
vi.mock('@/features/agenda/hooks', () => ({
  usePatientsMedecin: (...args: unknown[]) => usePatientsMedecin(...args),
}))

const MEDECIN = 'med-1'

function patient(over: Partial<PatientSummary> & { patientId: string }): PatientSummary {
  return {
    firstName: 'Yassine',
    lastName: 'Alaoui',
    photoUrl: null,
    gestionnaireId: null,
    gestionnaireNom: null,
    dernierRdvDate: '2026-03-12',
    dernierRdvStatut: 'TERMINE',
    hasFutureRdv: false,
    ...over,
  }
}

function setup(content: PatientSummary[], prenom = 'Yassine', nom = 'Alaoui') {
  const onUtiliser = vi.fn()
  usePatientsMedecin.mockReturnValue({ data: { content } })
  render(
    <DossiersExistantsHint
      medecinId={MEDECIN}
      prenom={prenom}
      nom={nom}
      onUtiliser={onUtiliser}
    />,
  )
  // Laisse passer le debounce de saisie.
  act(() => void vi.advanceTimersByTime(400))
  return { onUtiliser }
}

describe('DossiersExistantsHint', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    usePatientsMedecin.mockReset()
  })
  afterEach(() => vi.useRealTimers())

  test('alerte quand un dossier porte déjà ce nom', () => {
    // Arrange & Act
    setup([patient({ patientId: 'p1' })])

    // Assert
    expect(screen.getByText('Un dossier existe déjà pour ce nom')).toBeInTheDocument()
    expect(screen.getByText(/dernier RDV 12 mars 2026/)).toBeInTheDocument()
  })

  test('remonte le dossier choisi par le praticien', () => {
    // Arrange
    const cible = patient({ patientId: 'p1' })
    const { onUtiliser } = setup([cible])

    // Act
    screen.getByRole('button', { name: 'Utiliser ce dossier' }).click()

    // Assert
    expect(onUtiliser).toHaveBeenCalledWith(cible)
  })

  test('reste muet tant que le nom est trop court', () => {
    // Arrange & Act — un prénom seul rapprocherait des patients sans rapport.
    setup([patient({ patientId: 'p1' })], 'Y', '')

    // Assert
    expect(screen.queryByText(/dossier existe déjà/)).not.toBeInTheDocument()
  })

  test('reste muet quand aucun dossier ne correspond', () => {
    setup([])
    expect(screen.queryByText(/dossier existe déjà/)).not.toBeInTheDocument()
  })

  test('accorde le message au pluriel et borne la liste', () => {
    // Arrange & Act — quatre candidats, on n'en propose que trois.
    setup([
      patient({ patientId: 'p1' }),
      patient({ patientId: 'p2' }),
      patient({ patientId: 'p3' }),
      patient({ patientId: 'p4' }),
    ])

    // Assert
    expect(screen.getByText('3 dossiers existent déjà pour ce nom')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Utiliser ce dossier' })).toHaveLength(3)
  })
})
