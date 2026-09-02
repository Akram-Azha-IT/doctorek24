import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { LocalisationSection } from './LocalisationSection'
import { SaveActions } from './SaveActions'
import type { ProfilForm } from '../types'

const form: ProfilForm = {
  firstName: 'Hakim',
  lastName: 'Tazi',
  phone: '+212 6 00 00 00 01',
  specialite: 'Médecine générale',
  ville: 'Mohammedia',
  adresse: '123 rue mowahidin',
  lang: 'fr',
  latitude: 33.70669,
  longitude: -7.39584,
}

describe('SaveActions', () => {
  test('permet d’annuler et d’enregistrer les modifications en attente', () => {
    const onReset = vi.fn()
    render(
      <form>
        <SaveActions
          isPending={false}
          saveStatus="idle"
          saveError={null}
          isDirty
          onReset={onReset}
        />
      </form>,
    )

    expect(screen.getByText(/modifications non enregistrées/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: /annuler les modifications/i }))
    expect(onReset).toHaveBeenCalledOnce()
  })

  test('désactive les actions lorsque le profil est à jour', () => {
    render(
      <form>
        <SaveActions
          isPending={false}
          saveStatus="idle"
          saveError={null}
          isDirty={false}
          onReset={vi.fn()}
        />
      </form>,
    )

    expect(screen.getByText(/profil est à jour/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /annuler les modifications/i })).toBeDisabled()
  })
})

describe('LocalisationSection', () => {
  test('affiche la position et révèle les options avancées à la demande', () => {
    render(<LocalisationSection form={form} setLatLng={vi.fn()} />)

    expect(screen.getByText('Position enregistrée')).toBeInTheDocument()
    expect(screen.queryByRole('spinbutton', { name: 'Latitude' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /options avancées/i }))

    expect(screen.getByRole('spinbutton', { name: 'Latitude' })).toHaveValue(33.70669)
    expect(screen.getByRole('spinbutton', { name: 'Longitude' })).toHaveValue(-7.39584)
    expect(screen.getByRole('button', { name: /options avancées/i })).toHaveAttribute('aria-expanded', 'true')
  })
})
