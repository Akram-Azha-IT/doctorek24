import { renderHook, act } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { useSession } from './useSession'
import { __setCachedSession, type Session } from './session'

const PATIENT: Session = { role: 'PATIENT', id: 'p1', email: 'p@x.ma' }

describe('useSession', () => {
  test('returns null when no session is cached', () => {
    act(() => __setCachedSession(null))
    const { result } = renderHook(() => useSession())
    expect(result.current).toBeNull()
  })

  test('returns the cached session', () => {
    act(() => __setCachedSession(PATIENT))
    const { result } = renderHook(() => useSession())
    expect(result.current?.id).toBe('p1')
    expect(result.current?.role).toBe('PATIENT')
  })

  test('re-renders when session-updated event fires', () => {
    act(() => __setCachedSession(null))
    const { result } = renderHook(() => useSession())
    expect(result.current).toBeNull()

    act(() => __setCachedSession(PATIENT))
    expect(result.current?.id).toBe('p1')

    act(() => __setCachedSession(null))
    expect(result.current).toBeNull()
  })
})
