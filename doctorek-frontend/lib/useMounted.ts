'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

/**
 * true après hydratation client, false au rendu serveur — sans setState-dans-effet.
 * Remplace le pattern `const [mounted, setMounted] = useState(false); useEffect(...)`.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}
