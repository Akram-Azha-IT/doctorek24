'use client'

import { useId, useState } from 'react'

const NOTES = [1, 2, 3, 4, 5] as const

const LIBELLES: Record<number, string> = {
  1: 'Très insatisfait',
  2: 'Insatisfait',
  3: 'Correct',
  4: 'Satisfait',
  5: 'Très satisfait',
}

const OR = '#ECB22E'
const VIDE = '#E4E7EC'

function StarPath() {
  return (
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  )
}

/**
 * Note en lecture seule, remplissage fractionnaire.
 *
 * L'identifiant du dégradé est unique par instance : deux notes sur la même page
 * partageraient sinon le même `<defs>`, et la seconde reprendrait le remplissage
 * de la première.
 */
export function StarRating({
  value,
  size = 'md',
}: {
  value: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const uid = useId()
  const px = size === 'lg' ? 'h-5 w-5' : size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  return (
    <div className="flex gap-0.5" role="img" aria-label={`Note : ${value} sur 5`}>
      {NOTES.map((i) => {
        const remplissage = Math.min(1, Math.max(0, value - (i - 1)))
        const gradId = `${uid}-star-${i}`
        return (
          <svg key={i} className={px} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id={gradId}>
                <stop offset={`${remplissage * 100}%`} stopColor={OR} />
                <stop offset={`${remplissage * 100}%`} stopColor={VIDE} />
              </linearGradient>
            </defs>
            <g fill={`url(#${gradId})`}>
              <StarPath />
            </g>
          </svg>
        )
      })}
    </div>
  )
}

/**
 * Saisie de la note.
 *
 * Chaque étoile est un vrai bouton radio : la notation reste utilisable au clavier
 * et annoncée par un lecteur d'écran, ce qu'un survol de `<div>` ne permet pas.
 */
export function StarRatingInput({
  value,
  onChange,
  disabled,
  describedBy,
}: {
  value: number
  onChange: (note: number) => void
  disabled?: boolean
  describedBy?: string
}) {
  const uid = useId()
  const [survol, setSurvol] = useState(0)
  const affiche = survol || value

  return (
    <div className="flex items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Note de la consultation"
        aria-describedby={describedBy}
        className="flex gap-1"
        onMouseLeave={() => setSurvol(0)}
      >
        {NOTES.map((note) => {
          const active = note <= affiche
          return (
            <button
              key={note}
              type="button"
              role="radio"
              id={`${uid}-note-${note}`}
              aria-checked={value === note}
              aria-label={`${note} sur 5 : ${LIBELLES[note]}`}
              disabled={disabled}
              onClick={() => onChange(note)}
              onMouseEnter={() => setSurvol(note)}
              onFocus={() => setSurvol(note)}
              onBlur={() => setSurvol(0)}
              className="cursor-pointer rounded-md p-0.5 transition-transform hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-1"
            >
              <svg className="h-8 w-8" viewBox="0 0 24 24" aria-hidden="true">
                <g fill={active ? OR : VIDE}>
                  <StarPath />
                </g>
              </svg>
            </button>
          )
        })}
      </div>
      <span
        className="text-sm font-medium text-zinc-500 min-w-[7.5rem]"
        aria-hidden="true"
      >
        {affiche ? LIBELLES[affiche] : 'Votre note'}
      </span>
    </div>
  )
}
