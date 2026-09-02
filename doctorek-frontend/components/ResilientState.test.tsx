import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { ResilientState } from './ResilientState'

describe('ResilientState', () => {
  test('annonce un état vide sans le transformer en erreur', () => {
    const { container } = render(
      <ResilientState
        title="Aucune donnée"
        description="Les informations apparaîtront ici plus tard."
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Aucune donnée')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('resilient-empty-v1'),
    )
  })

  test('annonce immédiatement une panne récupérable', () => {
    const retry = vi.fn()
    const { container } = render(
      <ResilientState
        variant="offline"
        title="Service indisponible"
        description="Une nouvelle tentative est possible."
        primaryAction={{ label: 'Réessayer', onClick: retry }}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Service indisponible')
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('resilient-recovery-v1'),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(retry).toHaveBeenCalledOnce()
  })

  test('désactive la récupération pendant une nouvelle tentative', () => {
    render(
      <ResilientState
        variant="error"
        title="Erreur"
        description="Traitement en cours."
        primaryAction={{ label: 'Réessayer', onClick: vi.fn() }}
        isBusy
      />,
    )

    expect(screen.getByRole('button', { name: /Nouvelle tentative/ })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveAttribute('aria-busy', 'true')
  })

  test('rend les actions de navigation avec des liens réels', () => {
    render(
      <ResilientState
        title="Page introuvable"
        description="Reprenez votre navigation."
        primaryAction={{ label: "Retour à l'accueil", href: '/' }}
        secondaryAction={{ label: 'Rechercher', href: '/recherche' }}
      />,
    )

    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Rechercher' })).toHaveAttribute('href', '/recherche')
  })
})
