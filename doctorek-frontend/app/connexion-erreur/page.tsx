'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

/**
 * Page d'erreur de connexion — remplace la page Auth.js par défaut (anglaise,
 * technique). Messages en français, orientés utilisateur non technique, avec
 * une action claire (réessayer). Auth.js redirige ici avec ?error=<code>.
 */
const MESSAGES: Record<string, { titre: string; texte: string }> = {
  Configuration: {
    titre: 'Connexion momentanément indisponible',
    texte:
      "Notre service de connexion ne répond pas pour le moment. Ce n'est pas de votre faute, merci de réessayer dans quelques instants.",
  },
  AccessDenied: {
    titre: 'Accès refusé',
    texte:
      "Vous n'avez pas les autorisations nécessaires pour vous connecter. Si vous pensez qu'il s'agit d'une erreur, contactez le support.",
  },
  Verification: {
    titre: 'Lien expiré',
    texte:
      'Ce lien de connexion a expiré ou a déjà été utilisé. Merci de recommencer la connexion.',
  },
  Default: {
    titre: 'Une erreur est survenue',
    texte:
      "Impossible de vous connecter pour le moment. Merci de réessayer dans quelques instants.",
  },
}

function ErreurContenu() {
  const searchParams = useSearchParams()
  const code = searchParams.get('error') ?? 'Default'
  const { titre, texte } = MESSAGES[code] ?? MESSAGES.Default

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-zinc-100">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFDEDE]">
        <AlertTriangle className="h-7 w-7 text-[#E01E5A]" />
      </div>

      <h1 className="text-center text-xl font-bold text-[#010C2D]">{titre}</h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-[#465058]">{texte}</p>

      <div className="mt-7 flex flex-col gap-2.5">
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 rounded-lg bg-[#007DFF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00263C]"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer de me connecter
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-[#465058] transition-colors hover:border-zinc-300 hover:text-[#010C2D]"
        >
          <Home className="h-4 w-4" />
          Retour à l'accueil
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">
        Le problème persiste ? Écrivez-nous à{' '}
        <a href="mailto:support@doctorek.ma" className="font-medium text-[#1863A9] hover:underline">
          support@doctorek.ma
        </a>
      </p>
    </div>
  )
}

export default function ConnexionErreurPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F0F2F5] px-4 py-12">
      <Suspense fallback={<div className="h-6 w-6 animate-spin rounded-full border-2 border-[#007DFF]/30 border-t-[#007DFF]" />}>
        <ErreurContenu />
      </Suspense>
    </main>
  )
}
