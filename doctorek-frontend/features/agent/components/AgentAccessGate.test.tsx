import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { AgentAccessGate } from './AgentAccessGate'

describe('AgentAccessGate', () => {
  test('propose connexion et inscription au visiteur', () => {
    render(
      <AgentAccessGate
        estConnecte={false}
        loginHref="/login?redirect=%2Frecherche%3Fassistant%3Douvert"
      />
    )

    expect(screen.getByRole('link', { name: 'Se connecter pour commencer' })).toHaveAttribute(
      'href',
      '/login?redirect=%2Frecherche%3Fassistant%3Douvert'
    )
    expect(screen.getByRole('link', { name: 'Créer un compte patient' })).toHaveAttribute('href', '/inscription')
    expect(screen.getByText('Décrivez votre besoin')).toBeInTheDocument()
    expect(screen.getByText('Comparez les disponibilités')).toBeInTheDocument()
    expect(screen.getByText('Confirmez votre rendez-vous')).toBeInTheDocument()
  })

  test('explique le rôle requis à un utilisateur non patient', () => {
    render(<AgentAccessGate estConnecte loginHref="/login?redirect=%2F%3Fassistant%3Douvert" />)

    expect(screen.getByText('Un compte patient est nécessaire')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Changer de compte' })).toHaveAttribute(
      'href',
      '/login?redirect=%2F%3Fassistant%3Douvert'
    )
    expect(screen.queryByRole('link', { name: 'Créer un compte patient' })).not.toBeInTheDocument()
  })
})
