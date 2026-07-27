import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { AvailabilityWeekGrid } from './AvailabilityWeekGrid'
import { toLocalISODate } from '@/lib/date'
import type { RendezVous } from '@/lib/types'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

/** La grille n'affiche que la semaine courante : on ancre le RDV sur aujourd'hui. */
const TODAY_ISO = toLocalISODate(new Date())

const rdv: RendezVous = {
  id: 'r1',
  medecinId: 'm1',
  patientId: '6815ea0d-a790-4e16-9166-5996176c2a1a',
  patientPrenom: 'Akram',
  patientNom: 'Ben',
  dateRdv: TODAY_ISO,
  heureRdv: '10:00',
  duree: 30,
  statut: 'CONFIRME',
  motif: 'Douleurs abdominales depuis trois jours',
  createdAt: '2026-07-01T10:00:00Z',
}

function renderGrid(rendezVous: RendezVous[] = [rdv]) {
  return render(
    <AvailabilityWeekGrid
      disponibilites={[]}
      rendezVous={rendezVous}
      selectedDay={null}
      onSelectDay={vi.fn()}
    />,
  )
}

describe('AvailabilityWeekGrid', () => {
  beforeEach(() => vi.clearAllMocks())

  test('affiche le rendez-vous du jour dans la grille', () => {
    renderGrid()
    expect(screen.getByRole('button', { name: /ouvrir la fiche de akram ben/i })).toBeInTheDocument()
  })

  test('révèle le motif saisi par le patient au survol', () => {
    renderGrid()
    const bloc = screen.getByRole('button', { name: /ouvrir la fiche de akram ben/i })

    expect(screen.queryByText(/douleurs abdominales/i)).not.toBeInTheDocument()
    fireEvent.mouseEnter(bloc)

    expect(screen.getByText(/douleurs abdominales depuis trois jours/i)).toBeInTheDocument()
    expect(screen.getByText(/motif/i)).toBeInTheDocument()

    fireEvent.mouseLeave(bloc)
    expect(screen.queryByText(/douleurs abdominales/i)).not.toBeInTheDocument()
  })

  test("n'affiche pas de section motif quand il est vide", () => {
    renderGrid([{ ...rdv, motif: '   ' }])
    fireEvent.mouseEnter(screen.getByRole('button', { name: /ouvrir la fiche/i }))
    expect(screen.queryByText(/motif/i)).not.toBeInTheDocument()
  })

  test('ouvre la fiche patient au clic, avec prénom et nom en paramètres', () => {
    renderGrid()
    fireEvent.click(screen.getByRole('button', { name: /ouvrir la fiche de akram ben/i }))

    expect(push).toHaveBeenCalledWith(
      '/dashboard/medecin/patients/6815ea0d-a790-4e16-9166-5996176c2a1a?prenom=Akram&nom=Ben',
    )
  })

  test('masque les rendez-vous annulés', () => {
    renderGrid([{ ...rdv, statut: 'ANNULE' }])
    expect(screen.queryByRole('button', { name: /ouvrir la fiche/i })).not.toBeInTheDocument()
  })

  test('ne navigue pas quand le rendez-vous n’a pas de patient rattaché', () => {
    renderGrid([{ ...rdv, patientId: '' }])
    fireEvent.click(screen.getByRole('button', { name: /ouvrir la fiche/i }))
    expect(push).not.toHaveBeenCalled()
  })

  test('replie le popover dans le viewport près des bords', () => {
    renderGrid()
    const bloc = screen.getByRole('button', { name: /ouvrir la fiche/i })

    // Coin bas-droit : la bulle doit basculer à gauche et remonter pour rester visible.
    fireEvent.mouseEnter(bloc, { clientX: window.innerWidth, clientY: window.innerHeight })
    const popover = screen.getByText(/douleurs abdominales/i).closest('div.fixed') as HTMLElement
    expect(parseFloat(popover.style.left)).toBeLessThan(window.innerWidth)
    expect(parseFloat(popover.style.top)).toBeLessThan(window.innerHeight)

    // Coin haut-gauche : bornée par la marge écran, jamais négative.
    fireEvent.mouseEnter(bloc, { clientX: 0, clientY: 0 })
    expect(parseFloat(popover.style.left)).toBeGreaterThanOrEqual(0)
    expect(parseFloat(popover.style.top)).toBeGreaterThanOrEqual(0)
  })

  test('distingue visuellement un rendez-vous terminé', () => {
    renderGrid([{ ...rdv, statut: 'TERMINE' }])
    expect(screen.getByRole('button', { name: /ouvrir la fiche/i }).className).toContain('bg-gray-100')
  })
})
