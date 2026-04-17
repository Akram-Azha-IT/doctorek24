function getAvatarColor(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return `hsl(${hash % 360}, 55%, 42%)`
}

interface MedecinAvatarProps {
  firstName: string
  lastName: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'w-9 h-9 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
}

export function MedecinAvatar({ firstName, lastName, size = 'lg' }: MedecinAvatarProps) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const bg = getAvatarColor(`${firstName}${lastName}`)

  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {initials}
    </div>
  )
}
