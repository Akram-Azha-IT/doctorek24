'use client'

import { AlertTriangle, CheckCircle, X } from 'lucide-react'

interface Props {
  open: boolean
  userName: string
  isActive: boolean
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmToggleModal({ open, userName, isActive, isPending, onConfirm, onCancel }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Close */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
            isActive ? 'bg-red-50' : 'bg-emerald-50'
          }`}>
            {isActive
              ? <AlertTriangle className="h-7 w-7 text-red-500" />
              : <CheckCircle className="h-7 w-7 text-emerald-500" />
            }
          </div>

          {/* Title */}
          <h2 className="text-center text-lg font-extrabold text-[#010C2D]">
            {isActive ? 'Désactiver le compte' : 'Activer le compte'}
          </h2>

          {/* Body */}
          <p className="mt-2 text-center text-sm text-zinc-500 leading-relaxed">
            {isActive
              ? <>Voulez-vous vraiment désactiver le compte de <span className="font-semibold text-[#010C2D]">{userName}</span> ? L&apos;utilisateur ne pourra plus se connecter.</>
              : <>Voulez-vous réactiver le compte de <span className="font-semibold text-[#010C2D]">{userName}</span> ? L&apos;utilisateur pourra à nouveau se connecter.</>
            }
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              isActive
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {isPending
              ? 'En cours...'
              : isActive ? 'Désactiver' : 'Activer'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
