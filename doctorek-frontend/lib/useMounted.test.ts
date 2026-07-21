import { renderHook } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { useMounted } from './useMounted'

describe('useMounted', () => {
  test('returns true after client render', () => {
    const { result } = renderHook(() => useMounted())
    expect(result.current).toBe(true)
  })

  test('stays true across re-renders', () => {
    const { result, rerender } = renderHook(() => useMounted())
    rerender()
    expect(result.current).toBe(true)
  })
})
