import type { ReactNode } from 'react'

interface MissingValueProps {
  value: ReactNode
  fallback?: string
  className?: string
}

/** Rend une valeur absente explicite sans laisser apparaître un tiret ou `undefined`. */
export function MissingValue({
  value,
  fallback = 'Non renseigné',
  className = '',
}: Readonly<MissingValueProps>) {
  const missing =
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0)

  if (!missing) return <>{value}</>

  return (
    <span
      data-state="missing"
      className={`inline-flex items-center rounded-md bg-[#F1F5F9] px-2 py-0.5 text-xs font-medium text-[#64748B] ${className}`}
    >
      {fallback}
    </span>
  )
}
