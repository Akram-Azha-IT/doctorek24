import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { StarRating, StarRatingInput } from './StarRating'

describe('StarRating', () => {
  test('annonce la note plutôt que cinq images muettes', () => {
    render(<StarRating value={3.5} />)

    expect(screen.getByRole('img', { name: 'Note : 3.5 sur 5' })).toBeInTheDocument()
  })

  test('deux notes sur la même page ne partagent pas leur dégradé', () => {
    const { container } = render(
      <>
        <StarRating value={1} />
        <StarRating value={5} />
      </>,
    )

    const ids = Array.from(container.querySelectorAll('linearGradient')).map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('StarRatingInput', () => {
  test('remonte la note choisie', async () => {
    const onChange = vi.fn()
    render(<StarRatingInput value={0} onChange={onChange} />)

    await userEvent.click(screen.getByRole('radio', { name: '4 sur 5 : Satisfait' }))

    expect(onChange).toHaveBeenCalledWith(4)
  })

  test('la note est atteignable au clavier', async () => {
    const onChange = vi.fn()
    render(<StarRatingInput value={0} onChange={onChange} />)

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith(1)
  })

  test('marque la note courante comme sélectionnée', () => {
    render(<StarRatingInput value={2} onChange={() => {}} />)

    expect(screen.getByRole('radio', { name: '2 sur 5 : Insatisfait' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '5 sur 5 : Très satisfait' })).not.toBeChecked()
  })
})
