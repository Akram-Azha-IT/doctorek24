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
vi.mock('@/features/agenda/api', () => ({
  getCreneaux: (id: string, date: string) => getCreneauxMock(id, date),
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

function renderCard(onBookSlot = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MedecinCardList medecin={medecin} onBookSlot={onBookSlot} />
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
    const onBookSlot = renderCard()

    // Sélectionne le jour de demain (chip avec le numéro du jour)
    const dayNum = String(new Date(futureDate + 'T00:00:00').getDate())
    const dayBtns = await screen.findAllByRole('button')
    const dayBtn = dayBtns.find((b) => b.textContent?.includes(dayNum))
    expect(dayBtn).toBeDefined()
    await user.click(dayBtn!)

    const slotBtn = await screen.findByRole('button', { name: '09:00' })
    await user.click(slotBtn)
    expect(onBookSlot).toHaveBeenCalledWith(
      expect.objectContaining({ date: futureDate, debut: '09:00', fin: '09:30' }),
    )
  })
})
