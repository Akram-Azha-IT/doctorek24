'use client'

import { useState } from 'react'

/**
 * Teinte stable dérivée du nom : deux personnes différentes gardent des couleurs
 * distinctes, et la même personne garde la sienne d'un écran à l'autre.
 */
export function hueFromName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (name.codePointAt(i) ?? 0) + ((hash << 5) - hash)
  return ((hash % 360) + 360) % 360
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  const last = parts.at(-1) ?? ''
  return `${parts[0][0]}${last[0]}`.toUpperCase()
}

interface AvatarProps {
  readonly name: string
  /** Photo de profil ; à défaut (ou si elle ne charge pas) on retombe sur les initiales. */
  readonly photoUrl?: string | null
  /** Diamètre en pixels. */
  readonly size?: number
  readonly className?: string
  /** Anneau blanc — utile quand l'avatar chevauche une surface colorée. */
  readonly ring?: boolean
}

/**
 * Avatar unique de l'application : photo si elle existe, sinon initiales colorées.
 * Centralise le repli sur erreur — une URL de photo morte (avatar Google révoqué,
 * fichier supprimé) afficherait sinon une icône d'image cassée.
 */
export function Avatar({ name, photoUrl, size = 40, className = '', ring = false }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const showPhoto = !!photoUrl && !failed
  const ringCls = ring ? 'ring-2 ring-white' : ''

  if (showPhoto) {
    return (
      // Balise native assumée, et unique point du code où elle l'est pour une photo :
      // les photos téléversées sont stockées en data URI (voir le téléversement du
      // dashboard patient), format que next/image ne sait pas optimiser, tandis que les
      // avatars de connexion sociale viennent d'hôtes distants. Aucune liste de domaines
      // ne couvrirait les deux. Passer par ce composant évite d'éparpiller la dérogation.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full bg-[#EDF2F8] object-cover ${ringCls} ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${ringCls} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: `hsl(${hueFromName(name)} 55% 48%)`,
        fontSize: Math.max(10, Math.round(size * 0.36)),
      }}
    >
      {initialsFromName(name)}
    </span>
  )
}
