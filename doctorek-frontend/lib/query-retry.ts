import { ApiError } from './api-client'

const MAX_RETRIES = 2

/**
 * Réessaie uniquement les pannes probablement transitoires.
 * Les erreurs d'authentification, de validation et les annulations ne doivent
 * jamais déclencher une tempête de requêtes.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return false

  if (error instanceof ApiError) {
    if (error.status === 408 || error.status === 429 || error.status >= 500) {
      return failureCount < MAX_RETRIES
    }
    return false
  }

  if (error instanceof TypeError) return failureCount < MAX_RETRIES

  return failureCount < 1
}

export function queryRetryDelay(attemptIndex: number): number {
  return Math.min(750 * 2 ** attemptIndex, 5_000)
}
