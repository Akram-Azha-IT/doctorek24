'use client'

import { useId } from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { logout } from '@/lib/auth'
import { useAccepterConsentement, useConsentementStatut } from '../hooks'

/**
 * Recueil du consentement (loi 09-08) pour un compte qui n'en a pas encore donné.
 *
 * <p>Les comptes créés avant la mise en place du recueil, et ceux ouverts via Google sans
 * passer par notre formulaire, n'ont aucune trace d'accord. Sans cet écran, la conformité
 * ne couvrirait que les nouveaux inscrits.
 *
 * <p>Bloquant et sans croix de fermeture : un consentement qu'on peut esquiver n'en est
 * pas un. La seule autre issue est la déconnexion, jamais l'accès aux données.
 */
export function ConsentementGate() {
  const { data, isLoading } = useConsentementStatut()
  const accepter = useAccepterConsentement()
  const titreId = useId()

  if (isLoading || !data?.requis) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: 'rgba(1,12,45,0.65)', backdropFilter: 'blur(4px)' }}
    >
      <dialog
        open
        aria-labelledby={titreId}
        className="m-0 w-full max-w-lg overflow-hidden rounded-t-2xl bg-white p-0 text-inherit shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start gap-3 border-b border-zinc-100 px-6 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EBF4FF]">
            <ShieldCheck className="h-5 w-5 text-[#007DFF]" />
          </span>
          <div>
            <h2 id={titreId} className="text-base font-bold text-[#010C2D]">
              Vos données de santé
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Une confirmation est nécessaire avant de continuer.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 py-5 text-sm leading-relaxed text-[#465058]">
          <p>
            Doctorek traite vos données personnelles et de santé pour gérer vos rendez-vous,
            votre dossier médical et votre carte virtuelle. Vos données ne sont jamais vendues
            ni utilisées à des fins publicitaires.
          </p>
          <p>
            Seuls les praticiens que vous consultez, les proches que vous autorisez et, en cas
            d&apos;urgence, les secours via votre QR code, y accèdent.
          </p>
          <p>
            Le détail figure dans la{' '}
            <Link
              href="/confidentialite"
              target="_blank"
              className="font-semibold text-[#1863A9] underline underline-offset-2"
            >
              politique de confidentialité
            </Link>
            , conforme à la loi 09-08.
          </p>

          {accepter.isError && (
            <p
              role="alert"
              className="rounded-lg bg-[#FFF5F5] px-3 py-2 text-xs font-medium text-[#B4232A]"
            >
              Votre accord n&apos;a pas pu être enregistré. Réessayez.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-zinc-100 px-6 py-4 sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => accepter.mutate()}
            disabled={accepter.isPending}
            className="flex-1 cursor-pointer rounded-xl bg-[#007DFF] py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-[#00263C] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2"
          >
            {accepter.isPending ? 'Enregistrement…' : 'J’accepte'}
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={accepter.isPending}
            className="flex-1 cursor-pointer rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            Refuser et me déconnecter
          </button>
        </div>
      </dialog>
    </div>
  )
}
