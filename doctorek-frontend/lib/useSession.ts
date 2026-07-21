'use client'

import { useSyncExternalStore } from 'react'
import { getSession, type Session } from './session'

function subscribe(onChange: () => void): () => void {
  window.addEventListener('session-updated', onChange)
  return () => window.removeEventListener('session-updated', onChange)
}

const getServerSnapshot = (): Session | null => null

/**
 * Session réactive sans setState-dans-effet : s'abonne à 'session-updated'
 * et relit le cache stable de getSession(). Rendu serveur → null.
 */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, getServerSnapshot)
}
