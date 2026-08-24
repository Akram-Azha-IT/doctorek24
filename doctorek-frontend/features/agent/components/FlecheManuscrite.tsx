interface FlecheManuscriteProps {
  readonly className?: string
}

/**
 * Flèche de parcours dessinée comme un trait d'encre rapide.
 *
 * Le second tracé, très léger, évite l'aspect trop géométrique d'une icône
 * standard tout en restant décoratif pour les technologies d'assistance.
 */
export function FlecheManuscrite({ className = '' }: FlecheManuscriteProps) {
  return (
    <svg
      viewBox="0 0 42 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M3.5 13.8C13.2 13.2 22.3 10.4 35.8 8.7"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28.4 4.1C31.8 5.7 35 7.2 38.6 8.2C35.4 11.5 32.6 14.5 29.8 18.2"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.1 15.2C14.6 14.2 24.1 11.6 34.7 10.2"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.28"
      />
    </svg>
  )
}
