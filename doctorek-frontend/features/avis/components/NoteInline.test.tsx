import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { NoteInline } from './NoteInline'

describe('NoteInline', () => {
  test('affiche la moyenne et le volume d’avis', () => {
    render(<NoteInline note={{ medecinId: 'm1', noteMoyenne: 4.3, nombreAvis: 9 }} />)

    expect(screen.getByLabelText('Noté 4,3 sur 5, 9 avis')).toBeInTheDocument()
    expect(screen.getByText('4,3')).toBeInTheDocument()
    expect(screen.getByText('(9)')).toBeInTheDocument()
  })

  test('garde le dixième sur une note entière', () => {
    render(<NoteInline note={{ medecinId: 'm1', noteMoyenne: 5, nombreAvis: 2 }} />)

    expect(screen.getByText('5,0')).toBeInTheDocument()
  })

  test('n’affiche rien tant que la note du médecin est inconnue', () => {
    const { container } = render(<NoteInline note={undefined} />)

    expect(container).toBeEmptyDOMElement()
  })

  test('un médecin sans avis n’affiche pas une note de zéro', () => {
    const { container } = render(
      <NoteInline note={{ medecinId: 'm1', noteMoyenne: 0, nombreAvis: 0 }} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
