'use client'

import { describeError } from '@/lib/error-message'
import { ResilientState } from '@/components/ResilientState'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  isRetrying?: boolean
  /** Compact = variante réduite pour les petits conteneurs (drawers, cartes). */
  compact?: boolean
}

/**
 * État d'erreur professionnel et réutilisable : message français clair
 * (jamais l'erreur technique brute) + action de récupération.
 */
export function ErrorState({ error, onRetry, isRetrying, compact }: ErrorStateProps) {
  const { titre, texte, recuperable } = describeError(error)
  const offline = error instanceof TypeError || (error instanceof Error && error.name === 'TypeError')

  return (
    <ResilientState
      variant={offline ? 'offline' : 'error'}
      title={titre}
      description={texte}
      compact={compact}
      isBusy={isRetrying}
      primaryAction={recuperable && onRetry ? { label: 'Réessayer', onClick: onRetry } : undefined}
    />
  )
}
