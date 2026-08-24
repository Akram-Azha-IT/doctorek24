import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  test('affiche la page unique avec navigation désactivée', () => {
    render(<Pagination page={1} totalPages={1} onPage={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Page précédente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Page suivante' })).toBeDisabled()
  })

  test('navigue vers la page suivante', () => {
    const onPage = vi.fn()
    render(<Pagination page={2} totalPages={4} onPage={onPage} />)

    fireEvent.click(screen.getByRole('button', { name: 'Page suivante' }))
    expect(onPage).toHaveBeenCalledWith(3)
  })
})
