import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { useState } from 'react'
import { useResetOnChange } from './useResetOnChange'

function Pager({ filter }: { filter: string }) {
  const [page, setPage] = useState(3)
  useResetOnChange(filter, () => setPage(0))
  return <output>{`${filter}:${page}`}</output>
}

describe('useResetOnChange', () => {
  test('does not reset while key is stable', () => {
    const { rerender } = render(<Pager filter="a" />)
    rerender(<Pager filter="a" />)
    expect(screen.getByRole('status')).toHaveTextContent('a:3')
  })

  test('runs reset when key changes', () => {
    const { rerender } = render(<Pager filter="a" />)
    rerender(<Pager filter="b" />)
    expect(screen.getByRole('status')).toHaveTextContent('b:0')
  })
})
