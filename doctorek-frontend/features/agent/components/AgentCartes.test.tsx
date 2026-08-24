import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import type {
  AgentCard,
  AgentCreneauxCarte,
  AgentMedecinCarte,
  AgentRdvBrouillon,
  MedecinProfile,
} from '@/lib/types'
import { AgentCartes } from './AgentCartes'

const MEDECIN: MedecinProfile = {
  id: 'med-1',
  firstName: 'Amine',
  lastName: 'Bennani',
  specialite: 'Cardiologie',
  ville: 'Casablanca',
  adresse: '12 rue Ibn Sina',
  inpe: 'INPE-001',
  latitude: 33.57,
  longitude: -7.58,
  photoUrl: null,
}

function carteMedecin(over: Partial<AgentMedecinCarte> = {}): AgentMedecinCarte {
  return { profil: MEDECIN, noteMoyenne: 4.8, nombreAvis: 12, distanceKm: null, ...over }
}

function afficher(cartes: AgentCard[], onReserver = vi.fn(), onBrouillon = vi.fn()) {
  render(<AgentCartes cartes={cartes} onReserver={onReserver} onBrouillon={onBrouillon} />)
  return { onReserver, onBrouillon }
}

describe('AgentCartes', () => {
  test('la fiche praticien affiche les données du service, pas du texte généré', () => {
    afficher([{ type: 'medecins', donnees: [carteMedecin({ distanceKm: 2.1 })] }])

    expect(screen.getByText('Dr Amine Bennani')).toBeInTheDocument()
    expect(screen.getByText(/Cardiologie/)).toBeInTheDocument()
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByText('2.1 km')).toBeInTheDocument()
  })

  test('un médecin sans avis n’affiche pas de note', () => {
    afficher([{ type: 'medecin', donnees: carteMedecin({ noteMoyenne: null, nombreAvis: null }) }])

    expect(screen.getByText('Dr Amine Bennani')).toBeInTheDocument()
    expect(screen.queryByText('4.8')).not.toBeInTheDocument()
  })

  test('cliquer un créneau libre transmet le créneau exact au tiroir de réservation', async () => {
    const utilisateur = userEvent.setup()
    const creneaux: AgentCreneauxCarte = {
      medecin: MEDECIN,
      jours: [
        {
          date: '2026-08-18',
          creneaux: [
            { debut: '09:00', fin: '09:30', disponible: true },
            { debut: '09:30', fin: '10:00', disponible: false },
          ],
        },
      ],
    }
    const { onReserver } = afficher([{ type: 'creneaux', donnees: creneaux }])

    await utilisateur.click(screen.getByRole('button', { name: '09:00' }))

    expect(onReserver).toHaveBeenCalledWith({
      medecin: MEDECIN,
      date: '2026-08-18',
      debut: '09:00',
      fin: '09:30',
    })
  })

  test('la correspondance permet de développer les profils et tous les horaires', async () => {
    const utilisateur = userEvent.setup()
    const autreProfil = (id: string, firstName: string): MedecinProfile => ({
      ...MEDECIN,
      id,
      firstName,
      lastName: 'Alami',
    })
    const medecins: AgentMedecinCarte[] = [
      carteMedecin(),
      carteMedecin({ profil: autreProfil('med-2', 'Sara') }),
      carteMedecin({ profil: autreProfil('med-3', 'Nadia') }),
    ]
    const creneaux: AgentCreneauxCarte = {
      medecin: MEDECIN,
      jours: [
        {
          date: '2026-08-18',
          creneaux: [
            { debut: '09:00', fin: '09:30', disponible: true },
            { debut: '09:30', fin: '10:00', disponible: true },
            { debut: '10:00', fin: '10:30', disponible: true },
            { debut: '10:30', fin: '11:00', disponible: true },
          ],
        },
      ],
    }

    afficher([
      { type: 'medecins', donnees: medecins },
      { type: 'creneaux', donnees: creneaux },
    ])

    expect(screen.getByText('Dr Amine Bennani')).toBeInTheDocument()
    expect(screen.getByText('Dr Sara Alami')).not.toBeVisible()
    expect(screen.queryByRole('button', { name: /10:30/ })).not.toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: /\+ 2 autres profils correspondants/ }))
    expect(screen.getByText('Dr Sara Alami')).toBeInTheDocument()
    expect(screen.getByText('Dr Nadia Alami')).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Afficher tous les horaires (4)' }))
    expect(screen.getByRole('button', { name: /10:30/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Afficher moins d’horaires' })).toHaveAttribute('aria-expanded', 'true')
  })

  test('choisir un horaire depuis la correspondance prépare la confirmation', async () => {
    const utilisateur = userEvent.setup()
    const onReserver = vi.fn()
    const creneaux: AgentCreneauxCarte = {
      medecin: MEDECIN,
      jours: [{
        date: '2026-08-18',
        creneaux: [{ debut: '14:30', fin: '15:00', disponible: true }],
      }],
    }

    afficher([
      { type: 'medecins', donnees: [carteMedecin()] },
      { type: 'creneaux', donnees: creneaux },
    ], onReserver)

    await utilisateur.click(screen.getByRole('button', { name: /Choisir .*14:30.*Dr Amine Bennani/ }))

    expect(onReserver).toHaveBeenCalledWith({
      medecin: MEDECIN,
      date: '2026-08-18',
      debut: '14:30',
      fin: '15:00',
    })
  })

  test('un créneau déjà pris est affiché mais non cliquable', () => {
    const creneaux: AgentCreneauxCarte = {
      medecin: MEDECIN,
      jours: [
        {
          date: '2026-08-18',
          creneaux: [
            { debut: '09:00', fin: '09:30', disponible: true },
            { debut: '09:30', fin: '10:00', disponible: false },
          ],
        },
      ],
    }
    afficher([{ type: 'creneaux', donnees: creneaux }])

    expect(screen.getByText('09:30')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '09:30' })).not.toBeInTheDocument()
  })

  test('une journée sans aucun créneau libre est annoncée explicitement', () => {
    const creneaux: AgentCreneauxCarte = {
      medecin: MEDECIN,
      jours: [
        { date: '2026-08-18', creneaux: [{ debut: '09:00', fin: '09:30', disponible: false }] },
      ],
    }
    afficher([{ type: 'creneaux', donnees: creneaux }])

    expect(screen.getByText(/Aucun créneau libre/)).toBeInTheDocument()
  })

  test('la proposition de rendez-vous dit clairement que rien n’est réservé', async () => {
    const utilisateur = userEvent.setup()
    const brouillon: AgentRdvBrouillon = {
      medecinId: 'med-1',
      medecinNom: 'Dr Amine Bennani',
      patientId: 'pat-1',
      date: '2026-08-18',
      heure: '14:30',
      dureeMinutes: 30,
      motif: 'douleur thoracique',
      creneauLibre: true,
      indisponibilite: null,
    }
    const { onBrouillon } = afficher([{ type: 'brouillon', donnees: brouillon }])

    expect(screen.getByText(/Rien n'est réservé tant que vous n'avez pas confirmé/)).toBeInTheDocument()

    await utilisateur.click(screen.getByRole('button', { name: 'Vérifier et confirmer' }))
    expect(onBrouillon).toHaveBeenCalledWith(brouillon)
  })

  test('un créneau pris entre-temps affiche le motif et retire le bouton de confirmation', () => {
    const brouillon: AgentRdvBrouillon = {
      medecinId: 'med-1',
      medecinNom: 'Dr Amine Bennani',
      patientId: null,
      date: '2026-08-18',
      heure: '14:30',
      dureeMinutes: 0,
      motif: null,
      creneauLibre: false,
      indisponibilite: 'Ce créneau vient d’être réservé.',
    }
    afficher([{ type: 'brouillon', donnees: brouillon }])

    expect(screen.getByText('Ce créneau vient d’être réservé.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Vérifier et confirmer' })).not.toBeInTheDocument()
  })

  test('aucun rendez-vous à venir : message clair plutôt qu’une liste vide', () => {
    afficher([{ type: 'rdvs', donnees: [] }])
    expect(screen.getByText(/aucun rendez-vous à venir/i)).toBeInTheDocument()
  })

  test('aucune carte : rien n’est rendu', () => {
    const { container } = render(
      <AgentCartes cartes={[]} onReserver={vi.fn()} onBrouillon={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
