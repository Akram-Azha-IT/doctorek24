/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { AgentPanel } from './AgentPanel'

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

describe('AgentPanel', () => {
  test('réduit le panneau depuis son header', () => {
    const onFermer = vi.fn()

    render(
      <AgentPanel
        acces="anonyme"
        tours={[]}
        enCours={false}
        onEnvoyer={vi.fn()}
        onFermer={onFermer}
        onReinitialiser={vi.fn()}
        onReserver={vi.fn()}
        onBrouillon={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: "Réduire l'assistant" }))
    expect(onFermer).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Nouvelle conversation' })).not.toBeInTheDocument()
  })
})
