import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { InfosTab } from './page'

const updateCarte = vi.fn()
const createCarte = vi.fn()
const upsertInfos = vi.fn()

vi.mock('@/features/dossier/hooks', () => ({
  useInfosMedicales: () => ({ data: { notesGenerales: '' }, isLoading: false }),
  useUpsertInfosMedicales: () => ({ mutate: upsertInfos }),
}))

vi.mock('@/features/carte/hooks', () => ({
  useCarteByPatient: () => ({
    data: {
      groupeSanguin: null,
      allergies: [],
      maladiesChroniques: [],
      medicamentsActuels: [],
      antecedentsChirurgicaux: [],
      vaccinations: [],
    },
  }),
  useUpdateCarte: () => ({ mutate: updateCarte }),
  useCreateCarte: () => ({ mutate: createCarte }),
}))

describe('InfosTab', () => {
  beforeEach(() => {
    updateCarte.mockReset()
    createCarte.mockReset()
    upsertInfos.mockReset()
  })

  test('opens the allergy editor by default and switches editors from card actions', async () => {
    const user = userEvent.setup()
    render(<InfosTab patientId="patient-1" />)

    expect(screen.getByLabelText('Ajouter une allergie')).toBeInTheDocument()

    const chronicCard = screen.getByRole('heading', { name: 'Maladies chroniques' }).closest('section')
    expect(chronicCard).not.toBeNull()
    await user.click(within(chronicCard!).getByRole('button', { name: 'Ajouter' }))

    expect(screen.getByLabelText('Maladie chronique')).toBeInTheDocument()
    expect(screen.queryByLabelText('Ajouter une allergie')).not.toBeInTheDocument()
  })

  test('persists a blood-group selection through the existing card mutation', async () => {
    const user = userEvent.setup()
    render(<InfosTab patientId="patient-1" />)

    await user.selectOptions(screen.getByLabelText('Groupe sanguin'), 'O+')

    expect(updateCarte).toHaveBeenCalledWith(expect.objectContaining({ groupeSanguin: 'O+' }))
  })

  test('adds an allergy and closes the contextual editor', async () => {
    const user = userEvent.setup()
    render(<InfosTab patientId="patient-1" />)

    const allergyCard = screen.getByRole('heading', { name: 'Allergies' }).closest('section')
    expect(allergyCard).not.toBeNull()
    await user.type(screen.getByLabelText('Ajouter une allergie'), 'Pénicilline')
    await user.click(within(allergyCard!).getAllByRole('button', { name: 'Ajouter' })[1])

    expect(updateCarte).toHaveBeenCalledWith(
      expect.objectContaining({ allergies: ['Pénicilline'] }),
    )
    expect(screen.queryByLabelText('Ajouter une allergie')).not.toBeInTheDocument()
  })
})
