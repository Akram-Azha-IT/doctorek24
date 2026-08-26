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
  const descriptionId = useId()

  if (isLoading || !data?.requis) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 sm:p-8"
      style={{ background: 'rgba(1,12,45,0.58)', backdropFilter: 'blur(8px)' }}
    >
      <dialog
        open
        aria-labelledby={titreId}
        aria-describedby={descriptionId}
        aria-modal="true"
        className="relative m-0 max-h-[calc(100dvh-3rem)] w-full max-w-[36rem] overflow-y-auto rounded-[1.375rem] border border-white/80 bg-white p-0 text-inherit shadow-[0_24px_80px_rgba(1,12,45,0.28)]"
      >
        <div className="px-6 pb-5 pt-6 sm:px-8 sm:pt-8">
          <div className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#1863A9]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>Confidentialité</span>
          </div>
          <h2
            id={titreId}
            className="mt-3 text-[1.375rem] font-bold leading-tight tracking-[-0.025em] text-[#010C2D] sm:text-2xl"
          >
            Vos données de santé restent protégées
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-[#667085]">
            Votre accord est nécessaire pour accéder à votre espace patient.
          </p>
        </div>

        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="border-y border-[#E6EDF5] text-sm leading-6 text-[#465058]">
            <p className="py-4">
              <strong className="font-semibold text-[#010C2D]">Une utilisation limitée.</strong>{' '}
              Vos données servent uniquement à gérer vos rendez-vous, votre dossier médical et
              votre carte virtuelle. Elles ne sont jamais vendues ni utilisées à des fins
              publicitaires.
            </p>
            <p className="border-t border-[#E6EDF5] py-4">
              <strong className="font-semibold text-[#010C2D]">Un accès maîtrisé.</strong>{' '}
              Seuls les praticiens consultés, les proches autorisés et, en cas d&apos;urgence,
              les secours via votre QR code peuvent y accéder.
            </p>
          </div>

          <p className="mt-4 text-xs leading-5 text-[#667085]">
            <Link
              href="/confidentialite"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#1863A9] underline decoration-[#B6D7F5] underline-offset-4 transition-colors hover:text-[#007DFF]"
            >
              Consulter la politique de confidentialité
            </Link>
            <span> · Conforme à la loi 09-08.</span>
          </p>

          {accepter.isError && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-[#FECACA] bg-[#FFF7F7] px-3.5 py-2.5 text-xs font-medium text-[#B4232A]"
            >
              Votre accord n&apos;a pas pu être enregistré. Réessayez.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E6EDF5] bg-[#F8FAFC] px-6 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8 sm:py-5">
          <button
            type="button"
            onClick={() => void logout()}
            disabled={accepter.isPending}
            className="min-h-11 cursor-pointer rounded-lg px-4 text-sm font-semibold text-[#52606D] transition-colors hover:bg-[#EEF2F6] hover:text-[#010C2D] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#667085] focus-visible:ring-offset-2"
          >
            Refuser et me déconnecter
          </button>
          <button
            type="button"
            onClick={() => accepter.mutate()}
            disabled={accepter.isPending}
            className="min-h-11 min-w-[12rem] cursor-pointer rounded-lg bg-[#007DFF] px-6 text-sm font-bold text-white shadow-[0_2px_6px_rgba(0,125,255,0.22)] transition-colors hover:bg-[#0069D9] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2"
          >
            {accepter.isPending ? 'Enregistrement…' : 'Accepter et continuer'}
          </button>
        </div>
      </dialog>
    </div>
  )
}
