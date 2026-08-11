'use client'

import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react'
import { useCreerAvis } from '../hooks'
import { COMMENTAIRE_MAX, CreerAvisSchema } from '../schemas'
import { StarRatingInput } from './StarRating'

interface Props {
  rdvId: string
  medecinId: string
  medecinNom: string
  onClose: () => void
  onSuccess?: () => void
}

/**
 * Dépôt d'un avis sur une consultation passée.
 *
 * La note est demandée en premier et occupe la place principale : c'est le seul champ
 * obligatoire, et le commentaire ne doit pas donner l'impression qu'il faut rédiger
 * pour pouvoir noter.
 */
export function AvisFormModal({ rdvId, medecinId, medecinNom, onClose, onSuccess }: Readonly<Props>) {
  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [anonyme, setAnonyme] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const dialogRef = useRef<HTMLDialogElement>(null)
  const titreId = useId()
  const aideNoteId = useId()

  const creer = useCreerAvis(medecinId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Le focus entre dans la modale, sinon la tabulation resterait derrière elle.
    const premier = dialogRef.current?.querySelector<HTMLElement>('button, textarea, input')
    premier?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // FormEvent est deprecie dans les types React 19 : SyntheticEvent porte tout
  // ce dont la soumission a besoin.
  function onSubmit(e: SyntheticEvent) {
    e.preventDefault()
    setErreur(null)

    const parsed = CreerAvisSchema.safeParse({
      note,
      commentaire: commentaire.trim() || undefined,
      anonyme,
    })
    if (!parsed.success) {
      setErreur(parsed.error.issues[0]?.message ?? 'Formulaire incomplet')
      return
    }

    creer.mutate(
      {
        rdvId,
        note: parsed.data.note,
        commentaire: parsed.data.commentaire ?? null,
        anonyme: parsed.data.anonyme,
      },
      {
        onSuccess: () => {
          onSuccess?.()
          onClose()
        },
        onError: (e: unknown) => {
          setErreur(
            e instanceof Error ? e.message : "Votre avis n'a pas pu être enregistré.",
          )
        },
      },
    )
  }

  const restants = COMMENTAIRE_MAX - commentaire.length

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Le fond est un vrai bouton : cliquer a cote ferme la modale, et l'action reste
          atteignable au clavier au lieu d'etre reservee a la souris. */}
      <button
        type="button"
        aria-label="Fermer sans publier"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: 'rgba(1,12,45,0.55)', backdropFilter: 'blur(4px)' }}
      />
      <dialog
        ref={dialogRef}
        open
        aria-labelledby={titreId}
        className="relative m-0 w-full max-w-lg overflow-hidden rounded-t-2xl bg-white p-0 text-inherit shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 id={titreId} className="text-base font-bold text-zinc-900">
              Votre avis sur Dr.&nbsp;{medecinNom}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Visible publiquement sur son profil.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-2 cursor-pointer rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5 px-6 py-5">
          <div>
            <p id={aideNoteId} className="mb-2.5 text-sm font-semibold text-zinc-700">
              Comment s&apos;est passée votre consultation ?
            </p>
            <StarRatingInput
              value={note}
              onChange={setNote}
              disabled={creer.isPending}
              describedBy={aideNoteId}
            />
          </div>

          <div>
            <label htmlFor="avis-commentaire" className="mb-1.5 block text-sm font-semibold text-zinc-700">
              Un commentaire ? <span className="font-normal text-zinc-400">(facultatif)</span>
            </label>
            <textarea
              id="avis-commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value.slice(0, COMMENTAIRE_MAX))}
              rows={4}
              disabled={creer.isPending}
              placeholder="Accueil, écoute, explications, délai d'attente…"
              className="w-full resize-none rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-[#007DFF] focus:outline-none focus:ring-2 focus:ring-[#007DFF]/20 disabled:opacity-50"
            />
            <p className="mt-1 text-right text-[11px] text-zinc-400 tabular-nums">
              {restants} caractères restants
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-zinc-50 px-3.5 py-3">
            <input
              type="checkbox"
              checked={anonyme}
              onChange={(e) => setAnonyme(e.target.checked)}
              disabled={creer.isPending}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-[#007DFF]"
            />
            <span className="text-xs text-zinc-600">
              <span className="font-semibold text-zinc-700">Publier anonymement</span>
              <br />
              Votre avis s&apos;affichera sous « Patient vérifié ». Sinon, seuls votre prénom
              et l&apos;initiale de votre nom apparaîtront.
            </span>
          </label>

          {erreur && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {erreur}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={creer.isPending}
              className="flex-1 cursor-pointer rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creer.isPending || note === 0}
              className="flex-1 cursor-pointer rounded-xl bg-[#007DFF] py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-[#0052CC] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2"
            >
              {creer.isPending ? 'Envoi…' : 'Publier mon avis'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
