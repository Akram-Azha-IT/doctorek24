'use client'

import { useState } from 'react'

/**
 * Exécute `reset` quand `key` change — pendant le rendu (pattern React
 * "derive state from props"), sans effet ni cascade de re-rendus.
 */
export function useResetOnChange(key: string, reset: () => void): void {
  const [prevKey, setPrevKey] = useState(key)
  if (prevKey !== key) {
    setPrevKey(key)
    reset()
  }
}
