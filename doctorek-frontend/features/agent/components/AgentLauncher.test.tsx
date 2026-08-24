/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { AgentLauncher, type EtatAgent } from './AgentLauncher'

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

function rendu(etat: EtatAgent, peutConverser = true) {
  const onEtendre = vi.fn()
  const onOuvrir = vi.fn()
  const onReduire = vi.fn()
  const onEnvoyer = vi.fn()
  render(
    <AgentLauncher
      etat={etat}
      onEtendre={onEtendre}
      onOuvrir={onOuvrir}
      onReduire={onReduire}
      onEnvoyer={onEnvoyer}
      enCours={false}
      peutConverser={peutConverser}
    />
  )
  return { onEtendre, onOuvrir, onReduire, onEnvoyer }
}

describe('AgentLauncher', () => {
  test('l’état minimisé est une orbe portant uniquement le logo', () => {
    const actions = rendu('minimise')

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: "Ouvrir l'assistant Doctorek" }))

    expect(actions.onEtendre).toHaveBeenCalledOnce()
    expect(actions.onOuvrir).not.toHaveBeenCalled()
  })

  test('cliquer dans la saisie ouvre immédiatement le panneau complet', () => {
    const actions = rendu('barre')

    fireEvent.focus(screen.getByRole('textbox', { name: 'Votre demande de santé' }))

    expect(actions.onOuvrir).toHaveBeenCalledOnce()
  })

  test('envoyer ouvre le panneau et transmet la demande', () => {
    const actions = rendu('barre')
    const champ = screen.getByRole('textbox', { name: 'Votre demande de santé' })
    fireEvent.change(champ, { target: { value: 'Cardiologue à Casablanca' } })
    fireEvent.submit(champ.closest('form')!)

    expect(actions.onOuvrir).toHaveBeenCalled()
    expect(actions.onEnvoyer).toHaveBeenCalledWith('Cardiologue à Casablanca')
  })

  test('le composeur ouvert ne duplique pas le bouton de réduction du panneau', () => {
    const actions = rendu('ouvert')

    expect(screen.queryByRole('button', { name: "Réduire l'assistant" })).not.toBeInTheDocument()
    expect(actions.onReduire).not.toHaveBeenCalled()
  })

  test('un visiteur ouvre le panneau sans pouvoir saisir ni envoyer', () => {
    const actions = rendu('barre', false)
    const champ = screen.getByRole('textbox', { name: 'Votre demande de santé' })

    expect(champ).toHaveAttribute('readonly')
    expect(champ).toHaveAttribute('placeholder', 'Connectez-vous pour commencer')
    fireEvent.focus(champ)
    fireEvent.change(champ, { target: { value: 'Dermatologue' } })
    fireEvent.submit(champ.closest('form')!)

    expect(actions.onOuvrir).toHaveBeenCalled()
    expect(actions.onEnvoyer).not.toHaveBeenCalled()
  })
})
