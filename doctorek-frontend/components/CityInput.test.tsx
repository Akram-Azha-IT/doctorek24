import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { CityInput } from './CityInput'

/** L'API renvoie les villes non triées : le composant doit les ordonner. */
const API_CITIES = ['Zagora', 'Agadir', 'Étampes', 'Casablanca']

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ data: API_CITIES }) })))
  // jsdom n'implémente pas scrollIntoView, appelé quand l'option parcourue change.
  Element.prototype.scrollIntoView = vi.fn()
})

function renderInput(props: Partial<Parameters<typeof CityInput>[0]> = {}) {
  const onChange = vi.fn()
  render(<CityInput value="" onChange={onChange} {...props} />)
  return { onChange }
}

describe('CityInput', () => {
  test('expose un combobox relié à sa liste', async () => {
    renderInput()
    const input = screen.getByRole('combobox')

    // aria-expanded n'est valide que sur un rôle qui le supporte.
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveAttribute('aria-controls')
  })

  test('ouvre la liste au focus et l’annonce', async () => {
    renderInput()
    const input = screen.getByRole('combobox')

    fireEvent.focus(input)

    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'true'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  test('trie les villes entre elles, pas contre la locale', async () => {
    renderInput()
    fireEvent.focus(screen.getByRole('combobox'))

    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(1))
    const labels = screen.getAllByRole('option').map((o) => o.textContent?.trim())

    // Ordre français attendu : « Étampes » se classe avec les E, pas après Z.
    expect(labels).toEqual(['Agadir', 'Casablanca', 'Étampes', 'Zagora'])
  })

  test('désigne l’option parcourue au clavier via aria-activedescendant', async () => {
    renderInput()
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))

    expect(input).not.toHaveAttribute('aria-activedescendant')
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    const active = input.getAttribute('aria-activedescendant')
    expect(active).toBeTruthy()
    expect(document.getElementById(active as string)).toHaveAttribute('aria-selected', 'true')
  })

  test('remonte la ville choisie et referme la liste', async () => {
    const { onChange } = renderInput()
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))

    fireEvent.mouseDown(screen.getByText('Casablanca'))

    expect(onChange).toHaveBeenCalledWith('Casablanca')
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
  })

  test('Échap referme la liste sans rien choisir', async () => {
    const { onChange } = renderInput()
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument())

    fireEvent.keyDown(input, { key: 'Escape' })

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
    expect(onChange).not.toHaveBeenCalled()
  })
})
