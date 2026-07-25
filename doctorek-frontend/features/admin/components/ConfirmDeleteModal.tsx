'use client'

import { useState } from 'react'
import { Trash2, X } from 'lucide-react'

interface Props {
  readonly open: boolean
  readonly userName: string
  readonly email: string
  readonly isPending: boolean
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

/**
 * Suppression définitive d'un compte. Action lourde et irréversible : l'admin doit
 * retaper l'email exact pour armer le bouton (garde-fou anti-erreur).
 */
export function ConfirmDeleteModal({ open, userName, email, isPending, onConfirm, onCancel }: Props) {
  const [typed, setTyped] = useState('')
  if (!open) return null

  const matches = typed.trim().toLowerCase() === email.trim().toLowerCase()

  function handleCancel() {
    setTyped('')
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleCancel} />

      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={handleCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <Trash2 className="h-7 w-7 text-red-500" />
          </div>

          <h2 className="text-center text-lg font-extrabold text-[#010C2D]">Supprimer le compte</h2>

          <p className="mt-2 text-center text-sm text-zinc-500 leading-relaxed">
            Cette action est <span className="font-semibold text-red-600">irréversible</span>. Le compte de{' '}
            <span className="font-semibold text-[#010C2D]">{userName}</span> sera anonymisé, son accès supprimé,
            et son email libéré. Les données médicales sont conservées (obligation légale).
          </p>

          <label className="mt-5 block text-xs font-semibold text-zinc-500">
            Retapez l&apos;email pour confirmer
          </label>
          <input
            type="email"
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={email}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-[#010C2D] outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
          />
        </div>

        <div className="flex gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending || !matches}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-40"
          >
            {isPending ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}
