import Link from 'next/link'
import { CalendarDays, CircleCheckBig, MessageCircleMore, ShieldCheck } from 'lucide-react'

interface AgentAccessGateProps {
  readonly estConnecte: boolean
  readonly loginHref: string
}

const ETAPES = [
  { icone: MessageCircleMore, libelle: 'Décrivez votre besoin' },
  { icone: CalendarDays, libelle: 'Comparez les disponibilités' },
  { icone: CircleCheckBig, libelle: 'Confirmez votre rendez-vous' },
] as const

/** Point d’entrée rassurant vers le parcours patient, sans simuler une conversation. */
export function AgentAccessGate({ estConnecte, loginHref }: AgentAccessGateProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <section className="shrink-0 bg-[#00263C] px-6 py-4 text-center sm:px-8 sm:py-5">
        <div className="mx-auto flex w-full max-w-[26rem] flex-col items-center">
          <h3 className="font-heading text-[17px] font-semibold leading-[1.3] tracking-[-0.012em] text-white sm:text-[18px] sm:leading-[1.3]">
            {estConnecte
              ? 'Un compte patient est nécessaire'
              : 'Votre rendez-vous, sans complication'}
          </h3>
          <p className="mt-1.5 max-w-[23rem] font-sans text-[12px] font-normal leading-[1.5] text-white/85 sm:text-[13px] sm:leading-[1.5]">
            {estConnecte
              ? 'Connectez-vous avec votre compte patient pour utiliser l’assistant.'
              : 'Je vous guide vers le bon médecin et le bon créneau.'}
          </p>
        </div>
      </section>

      <div className={`flex min-h-0 flex-1 flex-col px-5 py-3 sm:px-8 sm:py-3.5 ${estConnecte ? 'justify-center' : ''}`}>
        {!estConnecte && (
          <ol className="relative mx-auto w-full max-w-[22rem] space-y-0 sm:space-y-1" aria-label="Étapes du parcours">
            <span
              aria-hidden="true"
              className="absolute bottom-5 left-[1.1rem] top-5 w-[2px] rounded-full bg-[#007DFF] sm:bottom-6 sm:left-[1.34rem] sm:top-6"
            />
            {ETAPES.map(({ icone: Icone, libelle }) => (
              <li key={libelle} className="relative flex min-h-10 items-center gap-3 sm:min-h-12 sm:gap-4">
                <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EBF5FF] text-[#007DFF] ring-[3px] ring-white sm:h-11 sm:w-11 sm:ring-4">
                  <Icone className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="font-heading text-[12.5px] font-semibold leading-5 tracking-[-0.005em] text-[#010C2D] sm:text-[13px]">
                  {libelle}
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className={`${estConnecte ? '' : 'mt-3 sm:mt-3.5'} flex w-full flex-col gap-2`}>
          <a
            href={loginHref}
            className="flex min-h-11 items-center justify-center rounded-xl bg-[#007DFF] px-5 font-heading text-[12.5px] font-semibold text-white shadow-[0_4px_12px_rgba(0,125,255,0.16)] transition-colors hover:bg-[#006FE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2 sm:min-h-12 sm:text-[13px]"
          >
            {estConnecte ? 'Changer de compte' : 'Se connecter pour commencer'}
          </a>
          {!estConnecte && (
            <Link
              href="/inscription"
              className="flex min-h-10 items-center justify-center rounded-xl border border-[#C9D9E8] bg-white px-5 font-heading text-[12px] font-semibold text-[#010C2D] transition-colors hover:border-[#AFCBE4] hover:bg-[#F7FAFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] sm:min-h-11 sm:text-[12.5px]"
            >
              Créer un compte patient
            </Link>
          )}
        </div>

        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[10.5px] leading-4 text-[#53677B] sm:mt-3 sm:text-[11px]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#2EB67D]" strokeWidth={2} aria-hidden="true" />
          Espace patient privé et sécurisé.
        </p>
      </div>
    </div>
  )
}
