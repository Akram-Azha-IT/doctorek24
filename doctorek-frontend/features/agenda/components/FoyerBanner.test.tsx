import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { FoyerBanner } from './FoyerBanner'
import type { FamilleMembre } from '@/lib/types'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

const useFoyerPatient = vi.fn()
vi.mock('@/features/agenda/hooks', () => ({
  useFoyerPatient: (medecinId: string, patientId: string) => useFoyerPatient(medecinId, patientId),
}))

const TITULAIRE = 'akram-id'
const PROCHE = 'momo-id'

function membre(over: Partial<FamilleMembre> & { patientId: string }): FamilleMembre {
  return {
    firstName: 'Momo',
    lastName: 'Mimo',
    photoUrl: null,
    gestionnaireId: null,
    gestionnaireNom: null,
    ...over,
  }
}

const FOYER: FamilleMembre[] = [
  membre({ patientId: TITULAIRE, firstName: 'Akram', lastName: 'Benhammou' }),
  membre({ patientId: PROCHE, gestionnaireId: TITULAIRE, gestionnaireNom: 'Akram Benhammou' }),
]

function setup(patientId: string, membres: FamilleMembre[] = FOYER) {
  useFoyerPatient.mockReturnValue({ data: membres })
  render(<FoyerBanner medecinId="doc-1" patientId={patientId} />)
}

describe('FoyerBanner', () => {
  beforeEach(() => {
    push.mockClear()
    useFoyerPatient.mockReset()
  })

  test('reste masqué quand le patient est seul dans son foyer', () => {
    // Arrange & Act
    setup(TITULAIRE, [membre({ patientId: TITULAIRE, firstName: 'Nadia' })])

    // Assert
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  test('nomme le titulaire depuis son propre dossier, où le gestionnaire est absent', () => {
    // Arrange & Act — sur le dossier du titulaire, gestionnaireNom est nul.
    setup(TITULAIRE)

    // Assert
    expect(screen.getByText('Foyer de Akram Benhammou')).toBeInTheDocument()
  })

  test('rappelle que les dossiers médicaux restent séparés', () => {
    setup(PROCHE)
    expect(screen.getByText(/dossiers médicaux distincts/)).toBeInTheDocument()
  })

  test('affiche la variante synthèse sans le texte explicatif', () => {
    useFoyerPatient.mockReturnValue({ data: FOYER })
    render(<FoyerBanner medecinId="doc-1" patientId={PROCHE} variant="summary" />)

    expect(screen.getByText('Foyer de Akram Benhammou')).toBeInTheDocument()
    expect(screen.queryByText(/dossiers médicaux distincts/)).not.toBeInTheDocument()
  })

  test('ouvre le dossier de l’autre membre avec son nom en paramètre', () => {
    // Arrange
    setup(PROCHE)

    // Act
    screen.getByRole('button', { name: /Akram Benhammou/ }).click()

    // Assert
    expect(push).toHaveBeenCalledWith(
      `/dashboard/medecin/patients/${TITULAIRE}?prenom=Akram&nom=Benhammou`,
    )
  })

  test('désactive la pastille du dossier déjà ouvert', () => {
    // Arrange
    setup(PROCHE)

    // Act
    const courant = screen.getByRole('button', { name: /Momo Mimo/ })

    // Assert
    expect(courant).toBeDisabled()
    expect(courant).toHaveAttribute('aria-current', 'page')
  })

  test('ne rend rien tant que le foyer est en cours de chargement', () => {
    // Arrange & Act
    useFoyerPatient.mockReturnValue({ data: undefined })
    const { container } = render(<FoyerBanner medecinId="doc-1" patientId={PROCHE} />)

    // Assert
    expect(container).toBeEmptyDOMElement()
  })
})
