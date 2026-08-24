'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { describeError } from '@/lib/error-message'
import LogoLoader from '@/components/LogoLoader'

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

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-2xl border border-[#FFD7D7] bg-white text-center ${
        compact ? 'px-5 py-8' : 'px-6 py-14'
      }`}
    >
      <span
        className={`mb-4 flex items-center justify-center rounded-2xl bg-[#FFF0F4] ${
          compact ? 'h-11 w-11' : 'h-14 w-14'
        }`}
      >
        <AlertTriangle className={compact ? 'h-5 w-5 text-[#E01E5A]' : 'h-7 w-7 text-[#E01E5A]'} />
      </span>
      <h3 className={`font-bold text-[#010C2D] ${compact ? 'text-sm' : 'text-base'}`}>{titre}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[#465058]">{texte}</p>

      {recuperable && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#007DFF] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#00263C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]/50 disabled:opacity-60 cursor-pointer"
        >
          {isRetrying ? (
            <LogoLoader variant="mark" size={16} inverse decorative />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRetrying ? 'Nouvelle tentative…' : 'Réessayer'}
        </button>
      )}
    </div>
  )
}
