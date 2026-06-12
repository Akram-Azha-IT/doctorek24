import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'

interface LogoProps {
  width?: number
  height?: number
  className?: string
  style?: CSSProperties
  href?: string
  priority?: boolean
  collapsed?: boolean
}

export default function Logo({
  width = 130,
  height = 44,
  className = 'h-9 w-auto',
  style,
  href = '/',
  priority = false,
  collapsed = false,
}: LogoProps) {
  const image = collapsed ? (
    <Image src="/icone-doctorek.png" alt="Doctorek" width={36} height={36} className="h-9 w-9 rounded-xl" priority={priority} />
  ) : (
    <Image src="/logo0.png" alt="Doctorek" width={width} height={height} className={className} style={style} priority={priority} />
  )

  return href ? <Link href={href}>{image}</Link> : image
}
