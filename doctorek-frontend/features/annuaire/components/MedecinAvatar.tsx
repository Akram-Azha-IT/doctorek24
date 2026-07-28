import { Avatar } from '@/components/Avatar'

interface MedecinAvatarProps {
  readonly firstName: string
  readonly lastName: string
  readonly photoUrl?: string | null
  readonly size?: 'sm' | 'md' | 'lg' | 'xl'
}

/** Tailles nommées de l'annuaire, converties en pixels pour le composant partagé. */
const SIZE_PX = { sm: 36, md: 48, lg: 64, xl: 96 } as const

/**
 * Avatar d'un médecin dans l'annuaire.
 *
 * <p>Simple adaptation de {@link Avatar} : la logique photo/initiales, la couleur stable
 * et le repli si l'image ne charge pas y sont centralisés. Cette enveloppe ne garde que
 * la convention de tailles propre à l'annuaire.
 */
export function MedecinAvatar({ firstName, lastName, photoUrl, size = 'lg' }: MedecinAvatarProps) {
  return (
    <Avatar
      name={`${firstName} ${lastName}`.trim()}
      photoUrl={photoUrl}
      size={SIZE_PX[size]}
    />
  )
}
