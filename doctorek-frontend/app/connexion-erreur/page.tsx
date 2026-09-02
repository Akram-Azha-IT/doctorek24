'use client'

import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import LogoLoader from '@/components/LogoLoader'

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
    <section
      aria-labelledby="connexion-error-title"
      role="alert"
      className="w-full max-w-[430px] overflow-hidden rounded-lg border border-[#D9E2EC] bg-white shadow-[0_8px_24px_rgba(0,38,60,0.07)]"
    >
      <header className="flex h-12 items-center bg-[#007DFF] px-5">
        <Image
          src="/logo-white.png"
          alt="Doctorek"
          width={90}
          height={29}
          preload
          className="h-auto w-[90px]"
        />
      </header>

      <div className="px-7 py-6 text-center sm:px-10">
        <Image
          src="/illustrations/free-day-calendar.webp"
          alt=""
          width={68}
          height={50}
          quality={70}
          aria-hidden="true"
          className="mx-auto h-[50px] w-[68px] object-cover object-center mix-blend-multiply"
        />

        <h1
          id="connexion-error-title"
          className="font-heading mt-3 text-[18px] font-bold leading-[1.35] tracking-[-0.015em] text-[#00263C]"
        >
          {titre}
        </h1>
        <p className="mx-auto mt-2.5 max-w-[340px] text-[13px] leading-5 text-[#465058]">{texte}</p>

        <Link
          href="/login"
          className="mx-auto mt-5 flex min-h-10 w-full max-w-[260px] items-center justify-center rounded-md bg-[#007DFF] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_3px_10px_rgba(0,125,255,0.18)] transition-colors hover:bg-[#006FE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2"
        >
          Réessayer la connexion
        </Link>
      </div>

      <div className="border-t border-[#E3E9F0] px-7 py-4 text-center sm:px-10">
        <h2 className="text-[13px] font-bold text-[#00263C]">Besoin d&apos;aide pour vous connecter&nbsp;?</h2>
        <p className="mx-auto mt-1.5 max-w-[350px] text-[11px] leading-[1.65] text-[#64748B]">
          Revenez à{' '}
          <Link
            href="/"
            className="font-semibold text-[#006FE6] underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
          >
            l&apos;accueil
          </Link>{' '}
          ou écrivez à{' '}
          <a
            href="mailto:support@doctorek.ma"
            className="font-semibold text-[#006FE6] underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF]"
          >
            support@doctorek.ma
          </a>
          .
        </p>
      </div>
    </section>
  )
}

export default function ConnexionErreurPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F6F9] px-4 py-10 sm:px-6">
      <Suspense fallback={<LogoLoader width={120} label="Chargement…" />}>
        <ErreurContenu />
      </Suspense>
    </main>
  )
}
