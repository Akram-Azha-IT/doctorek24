import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MedecinCardList } from './MedecinCardList'
import type { Creneau, MedecinProfile } from '@/lib/types'
import { nextNDaysISO } from '@/lib/disponibilite'

vi.mock('./MedecinAvatar', () => ({
  MedecinAvatar: () => <div data-testid="avatar" />,
}))

const dates = nextNDaysISO(30)
const futureDate = dates[1] // demain — pas de filtre "heure passée"

const slots: Creneau[] = [
  { debut: '09:00', fin: '09:30', disponible: true },
  { debut: '09:30', fin: '10:00', disponible: false },
  { debut: '10:00', fin: '10:30', disponible: true },
] as Creneau[]

const getCreneauxMock = vi.fn(async (_id: string, date: string) =>
  date === futureDate ? slots : [],
)
// La carte peut ouvrir la fenêtre de liste d'attente : le module API doit exposer
// tout ce que la chaîne d'imports consomme, pas seulement les créneaux.
vi.mock('@/features/agenda/api', () => ({
  getCreneaux: (id: string, date: string) => getCreneauxMock(id, date),
  getListeAttente: vi.fn(async () => []),
  rejoindreListeAttente: vi.fn(),
  quitterListeAttente: vi.fn(),
}))

const medecin = {
  id: 'm1',
  firstName: 'Sara',
  lastName: 'Bennani',
  specialite: 'Cardiologue',
  ville: 'Rabat',
  adresse: '1 rue X',
  inpe: '123',
  acceptNouveauxPatients: true,
} as MedecinProfile

function renderCard(onBookSlot = vi.fn(), searchDate?: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MedecinCardList medecin={medecin} onBookSlot={onBookSlot} searchDate={searchDate} />
    </QueryClientProvider>,
  )
  return onBookSlot
}

describe('MedecinCardList', () => {
  test('shows doctor identity', async () => {
    renderCard()
    expect(await screen.findByText(/Sara\s+Bennani/)).toBeInTheDocument()
    expect(screen.getByText(/Cardiologue/)).toBeInTheDocument()
  })

  test('books an available slot on the selected day', async () => {
    const user = userEvent.setup()
    const onBookSlot = renderCard(vi.fn(), futureDate)

    const slotBtn = await screen.findByRole('button', { name: '09:00' })
    await user.click(slotBtn)
    expect(onBookSlot).toHaveBeenCalledWith(
      expect.objectContaining({ date: futureDate, debut: '09:00', fin: '09:30' }),
    )
  })
})
