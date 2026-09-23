import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface AgentAccessGateProps {
  readonly estConnecte: boolean
  readonly loginHref: string
}

/** L’accueil public ne collecte aucune demande avant authentification. */
export function AgentAccessGate({ estConnecte, loginHref }: AgentAccessGateProps) {
  const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2'

  return (
    <div className="agent-accueil flex min-h-0 flex-col bg-white">
      <div className="min-h-0 overflow-y-auto bg-gradient-to-b from-[#EBF5FF] via-white to-white px-5 pb-3 pt-5 sm:px-8 sm:pt-6">
        <div className="relative grid grid-cols-[1fr_100px] items-center gap-2 sm:grid-cols-[1.15fr_1fr] sm:gap-4">
          <div className="relative z-10">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#007DFF] sm:text-xs">Bienvenue sur Doctorek</p>
            <h3 className="font-heading text-[25px] font-semibold leading-[1.12] tracking-[-0.035em] text-[#010C2D] sm:text-[36px]">
              {estConnecte ? 'Un compte patient est nécessaire' : <>Bonjour,<br />comment puis-je<br />vous aider ?</>}
            </h3>
            <p className="mt-3 text-[13px] leading-5 text-[#465058] sm:text-[15px] sm:leading-6">
              {estConnecte
                ? 'Connectez-vous avec votre compte patient pour utiliser l’assistant.'
                : 'Trouvez un médecin et ses disponibilités, simplement en discutant.'}
            </p>
          </div>
          <div className="relative isolate" aria-hidden="true">
            <div className="absolute inset-x-0 inset-y-5 -z-10 rounded-full bg-[#DFEFFE]/70" />
            <div className="absolute -right-1 -top-3 z-10 hidden rounded-2xl bg-white/95 px-3 py-2 text-xs leading-5 text-[#007DFF] shadow-[0_6px_24px_rgba(0,125,255,0.06)] sm:block">
              <span className="font-semibold">Une question ?</span><br />Je suis là pour vous.
            </div>
            <Image src="/agent-robot-welcome-v1.png" alt="" width={280} height={280} sizes="(max-width: 639px) 100px, 250px" className="h-auto w-full object-contain" />
          </div>
        </div>

      </div>
      <div className="shrink-0 px-5 pb-1 pt-1 sm:px-8">
        {!estConnecte && <p className="mb-2 text-center text-[11px] text-[#53677B]">Connectez-vous pour discuter avec l’assistant.</p>}
        <a href={loginHref} className={`mx-auto flex min-h-11 max-w-72 items-center justify-center gap-3 rounded-full bg-[#007DFF] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#006FE6] ${focus}`}>
          {estConnecte ? 'Changer de compte' : 'Se connecter'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
        {!estConnecte && (
          <Link href="/inscription" className={`mt-1 flex min-h-11 items-center justify-center rounded-xl text-sm font-medium text-[#0070DF] hover:underline ${focus}`}>
            Créer un compte patient
          </Link>
        )}
      </div>
    </div>
  )
}
