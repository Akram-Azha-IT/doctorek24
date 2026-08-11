import type { NoteMedecin } from '@/lib/types'

/**
 * Note d'un médecin sur une carte de résultat.
 *
 * Une seule étoile, pas cinq : dans une liste, le chiffre se compare d'un coup d'œil
 * là où cinq étoiles répétées à chaque ligne deviennent du bruit. Le volume d'avis
 * accompagne toujours la moyenne — 5,0 sur un avis ne vaut pas 4,3 sur cent.
 */
export function NoteInline({ note }: { note: NoteMedecin | undefined }) {
  if (!note || note.nombreAvis === 0) return null

  const moyenne = note.noteMoyenne.toFixed(1).replace('.', ',')

  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Noté ${moyenne} sur 5, ${note.nombreAvis} avis`}
    >
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="#ECB22E" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="text-[13px] font-bold leading-none text-[#010C2D] tabular-nums">
        {moyenne}
      </span>
      <span className="text-[11px] font-medium leading-none text-zinc-400 tabular-nums">
        ({note.nombreAvis})
      </span>
    </span>
  )
}
