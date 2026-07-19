/**
 * Motif zellige — étoile à 8 branches (khatim), figure géométrique marocaine
 * emblématique. Rendu en filigrane très discret pour donner une identité
 * nationale à l'espace famille, sans surcharger. Purement décoratif.
 */
function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = []
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? outer : inner
    const angle = (Math.PI / 8) * i - Math.PI / 2
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`)
  }
  return `M${points.join('L')}Z`
}

interface MoroccanPatternProps {
  className?: string
  color?: string
  opacity?: number
}

export function MoroccanPattern({
  className,
  color = '#FFFFFF',
  opacity = 0.07,
}: MoroccanPatternProps) {
  const tile = 56
  const star = starPath(tile / 2, tile / 2, 15, 6.2)

  return (
    <svg className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="zellige" width={tile} height={tile} patternUnits="userSpaceOnUse">
          <path d={star} fill="none" stroke={color} strokeWidth="1.1" opacity={opacity} />
          <circle cx={tile / 2} cy={tile / 2} r="1.6" fill={color} opacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#zellige)" />
    </svg>
  )
}
