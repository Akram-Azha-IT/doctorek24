'use client'

import * as React from 'react'

type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
  leadingIcon?: React.ReactNode
  trailing?: React.ReactNode
  showPasswordToggle?: boolean
}

/**
 * Editorial-style auth input. Floating-feel label + subtle bottom-emphasized
 * border. Uses brand palette tokens for focus + error states.
 */
export const AuthField = React.forwardRef<HTMLInputElement, AuthInputProps>(
  function AuthField({ label, hint, error, leadingIcon, trailing, showPasswordToggle, className, id, type, ...props }, ref) {
    const generatedId = React.useId()
    const fieldId = id ?? generatedId
    const errorId = `${fieldId}-error`
    const hasError = Boolean(error)
    const [showPwd, setShowPwd] = React.useState(false)
    const isPassword = type === 'password'
    const resolvedType = isPassword && showPwd ? 'text' : (type ?? 'text')

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={fieldId}
          className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#465058]"
        >
          {label}
        </label>

        <div
          className={[
            'group relative flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm shadow-[0_1px_0_0_rgba(1,12,45,0.04)]',
            'ring-1 transition-all duration-150',
            hasError
              ? 'ring-[#E01E5A]/40 focus-within:ring-[#E01E5A]'
              : 'ring-[#E8EFF6] focus-within:ring-[#007DFF]/40 focus-within:shadow-[0_0_0_4px_rgba(0,125,255,0.08)]',
          ].join(' ')}
        >
          {leadingIcon && (
            <span className="text-[#3793E0]" aria-hidden="true">
              {leadingIcon}
            </span>
          )}
          <input
            id={fieldId}
            ref={ref}
            type={resolvedType}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errorId : undefined}
            className={[
              'min-w-0 flex-1 bg-transparent text-[15px] text-[#010C2D] placeholder:text-[#9aa4ad] outline-none',
              className ?? '',
            ].join(' ')}
            {...props}
          />
          {trailing}
          {isPassword && (showPasswordToggle !== false) && (
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              onClick={() => setShowPwd(v => !v)}
              className="shrink-0 text-[#9aa4ad] hover:text-[#465058] transition-colors focus-visible:outline-none"
            >
              {showPwd ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>

        {hasError ? (
          <p id={errorId} role="alert" className="text-xs font-medium text-[#E01E5A]">{error}</p>
        ) : hint ? (
          <p className="text-xs text-[#465058]/80">{hint}</p>
        ) : null}
      </div>
    )
  }
)

interface SegmentedTabsProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: readonly { value: T; label: string; sublabel?: string; icon?: React.ReactNode }[]
  ariaLabel?: string
}

/** Clean segmented tab control — white pill on selected, icon+label layout. */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="grid gap-1 rounded-xl bg-[#EBF4FF] p-1 ring-1 ring-[#007DFF]/15"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={[
              'relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-semibold transition-all duration-150',
              active
                ? 'bg-white text-[#007DFF] shadow-[0_1px_6px_-2px_rgba(1,12,45,0.14)] ring-1 ring-[#E8EFF6]'
                : 'text-[#465058] hover:text-[#010C2D]',
            ].join(' ')}
          >
            {opt.icon && (
              <span className={active ? 'text-[#007DFF]' : 'text-[#465058]'}>
                {opt.icon}
              </span>
            )}
            <span className="leading-tight">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export function PrimaryButton({
  loading,
  disabled,
  children,
  className,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        'group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#007DFF] px-5 py-3.5 text-[15px] font-semibold text-white',
        'transition-all duration-200 hover:bg-[#0066CC] active:translate-y-[1px]',
        'shadow-[0_6px_20px_-6px_rgba(0,125,255,0.5)] hover:shadow-[0_8px_24px_-6px_rgba(0,125,255,0.6)]',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#007DFF]',
        className ?? '',
      ].join(' ')}
    >
      {loading && (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
        />
      )}
      <span>{children}</span>
      {!loading && (
        <span
          aria-hidden
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        >
          →
        </span>
      )}
    </button>
  )
}

/** Tiny icons used by AuthField leadingIcon */
export const Icons = {
  mail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  lock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  user: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  phone: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  ),
  id: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M14 10h4M14 13h3M5 17h8" />
    </svg>
  ),
  stethoscope: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v6a4 4 0 0 0 8 0V3" />
      <path d="M10 13v3a5 5 0 0 0 10 0v-3" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  ),
  pin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
}
