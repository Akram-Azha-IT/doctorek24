'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import LogoLoader from '@/components/LogoLoader'

export type ResilientStateVariant = 'empty' | 'missing' | 'partial' | 'error' | 'offline'

export interface ResilientStateAction {
  label: string
  href?: string
  onClick?: () => void
  disabled?: boolean
}

interface ResilientStateProps {
  title: string
  description: ReactNode
  variant?: ResilientStateVariant
  primaryAction?: ResilientStateAction
  secondaryAction?: ResilientStateAction
  actions?: ReactNode
  compact?: boolean
  surface?: 'card' | 'plain'
  showIllustration?: boolean
  isBusy?: boolean
  className?: string
}

const ILLUSTRATIONS: Record<ResilientStateVariant, string> = {
  empty: '/illustrations/resilient-empty-v1.webp',
  missing: '/illustrations/resilient-empty-v1.webp',
  partial: '/illustrations/resilient-empty-v1.webp',
  error: '/illustrations/resilient-recovery-v1.webp',
  offline: '/illustrations/resilient-recovery-v1.webp',
}

function StateAction({
  action,
  primary,
  busy,
}: Readonly<{ action: ResilientStateAction; primary?: boolean; busy?: boolean }>) {
  const className = `inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 ${
    primary
      ? 'bg-[#007DFF] text-white shadow-[0_3px_10px_rgba(0,125,255,0.18)] hover:bg-[#006FE6]'
      : 'border border-[#D9E2EC] bg-white text-[#35415D] hover:border-[#AFC3D8] hover:text-[#00263C]'
  }`

  if (action.href) {
    return (
      <Link href={action.href} className={className} aria-disabled={action.disabled || busy}>
        {action.label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled || busy}
      className={className}
    >
      {busy ? (
        <span className="inline-flex items-center gap-2">
          <LogoLoader variant="mark" size={16} inverse decorative />
          Nouvelle tentative…
        </span>
      ) : (
        action.label
      )}
    </button>
  )
}

/**
 * État de résilience partagé pour les listes vides, données manquantes et pannes.
 * Le contenu reste utile : explication courte, action de récupération et aucun
 * détail technique exposé à l'utilisateur.
 */
export function ResilientState({
  title,
  description,
  variant = 'empty',
  primaryAction,
  secondaryAction,
  actions,
  compact = false,
  surface = 'card',
  showIllustration = true,
  isBusy = false,
  className = '',
}: Readonly<ResilientStateProps>) {
  const isAlert = variant === 'error' || variant === 'offline'

  return (
    <section
      role={isAlert ? 'alert' : 'status'}
      aria-live={isAlert ? 'assertive' : 'polite'}
      aria-busy={isBusy || undefined}
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'px-5 py-6' : 'px-6 py-10 sm:px-10 sm:py-12'
      } ${
        surface === 'card'
          ? 'rounded-xl border border-[#E1E8F0] bg-white shadow-[0_8px_24px_rgba(0,38,60,0.045)]'
          : ''
      } ${className}`}
    >
      {showIllustration && (
        <Image
          src={ILLUSTRATIONS[variant]}
          alt=""
          width={compact ? 136 : 208}
          height={compact ? 102 : 156}
          quality={70}
          aria-hidden="true"
          className={`${compact ? 'h-[102px] w-[136px]' : 'h-[156px] w-[208px]'} object-contain`}
        />
      )}

      <h3
        className={`font-heading font-bold tracking-[-0.015em] text-[#00263C] ${
          showIllustration ? (compact ? 'mt-2' : 'mt-3') : ''
        } ${compact ? 'text-sm' : 'text-lg'}`}
      >
        {title}
      </h3>
      <div className={`max-w-md leading-relaxed text-[#64748B] ${compact ? 'mt-1 text-xs' : 'mt-2 text-sm'}`}>
        {description}
      </div>

      {(primaryAction || secondaryAction || actions) && (
        <div className={`flex flex-wrap items-center justify-center gap-2.5 ${compact ? 'mt-4' : 'mt-6'}`}>
          {primaryAction && <StateAction action={primaryAction} primary busy={isBusy} />}
          {secondaryAction && <StateAction action={secondaryAction} />}
          {actions}
        </div>
      )}
    </section>
  )
}
