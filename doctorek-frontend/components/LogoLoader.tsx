import type { CSSProperties } from 'react'

interface LogoLoaderProps {
  width?: number
  label?: string | null
  fullScreen?: boolean
  background?: string
  className?: string
  variant?: 'wordmark' | 'mark'
  size?: number
  inverse?: boolean
  decorative?: boolean
}

export default function LogoLoader({
  width = 160,
  label = null,
  fullScreen = false,
  background = '#F0F2F5',
  className,
  variant = 'wordmark',
  size = 18,
  inverse = false,
  decorative = false,
}: LogoLoaderProps) {
  const accessibilityProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'status', 'aria-label': label ?? 'Chargement' }

  if (variant === 'mark') {
    const mark = (
      <span
        className={`logo-loader-mark ${inverse ? 'logo-loader-mark--inverse' : ''} ${className ?? ''}`}
        style={{ ['--ll-size' as string]: `${size}px` } as CSSProperties}
        {...accessibilityProps}
      />
    )

    if (!fullScreen) return mark

    return (
      <div className="fixed inset-0 z-50 grid place-items-center" style={{ background }}>
        {mark}
      </div>
    )
  }

  const loader = (
    <div className="flex flex-col items-center gap-3">
      <div
        className="logo-loader"
        style={{ ['--ll-w' as string]: `${width}px` } as CSSProperties}
        {...accessibilityProps}
      >
        <div className="logo-loader__ghost" />
        <div className="logo-loader__draw" />
      </div>
      {label !== null && (
        <p className="text-xs font-medium tracking-wide text-[#465058]">
          {label}
        </p>
      )}
    </div>
  )

  if (!fullScreen) {
    return <div className={className}>{loader}</div>
  }

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center ${className ?? ''}`}
      style={{ background }}
    >
      {loader}
    </div>
  )
}
