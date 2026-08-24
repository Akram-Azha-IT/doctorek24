'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowUp, Minus } from 'lucide-react'

export type EtatAgent = 'minimise' | 'barre' | 'ouvert'

interface AgentLauncherProps {
  readonly etat: EtatAgent
  readonly onEtendre: () => void
  readonly onOuvrir: () => void
  readonly onReduire: () => void
  readonly onEnvoyer: (message: string) => void
  readonly enCours: boolean
  readonly peutConverser: boolean
}

/**
 * Point d'entrée de l'agent en trois états contrôlés.
 *
 * - minimisé : une orbe portant uniquement la marque ;
 * - barre : le patient voit où formuler son intention ;
 * - ouvert : la même barre reste le poste de commande sous le parcours complet.
 *
 * Le focus dans le champ ouvre toujours le panneau : commencer à écrire revient
 * à entrer dans la conversation, sans clic supplémentaire.
 */
export function AgentLauncher({
  etat,
  onEtendre,
  onOuvrir,
  onReduire,
  onEnvoyer,
  enCours,
  peutConverser,
}: AgentLauncherProps) {
  const [message, setMessage] = useState('')

  function soumettre() {
    const texte = message.trim()
    if (!peutConverser) {
      onOuvrir()
      return
    }
    if (!texte || enCours) return
    onOuvrir()
    onEnvoyer(texte)
    setMessage('')
  }

  if (etat === 'minimise') {
    return (
      <button
        type="button"
        onClick={onEtendre}
        aria-label="Ouvrir l'assistant Doctorek"
        className="agent-orbe pointer-events-auto relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#168AFF] via-[#007DFF] to-[#00263C] p-[3px] shadow-[0_10px_28px_rgba(0,38,60,0.34),0_0_0_4px_rgba(0,125,255,0.12)] ring-1 ring-white/80 transition-transform hover:-translate-y-0.5 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2 sm:h-14 sm:w-14"
      >
        <span className="flex h-full w-full items-center justify-center rounded-full bg-white">
          <Image src="/icone-doctorek.png" alt="" width={34} height={34} className="h-7 w-7 sm:h-8 sm:w-8" />
        </span>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#2EB67D] shadow-[0_0_0_1px_rgba(0,38,60,0.28)] sm:h-3.5 sm:w-3.5" aria-hidden="true" />
      </button>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        soumettre()
      }}
      className={`agent-barre ${etat === 'ouvert' ? 'agent-barre-ouverte' : ''} pointer-events-auto flex origin-center items-center gap-2 transition-[width,transform,box-shadow] duration-300 ease-out focus-within:shadow-[0_18px_46px_rgba(1,12,45,0.24)] ${
        etat === 'ouvert'
          ? 'h-[4.5rem] w-[min(100%,31.5rem)] rounded-b-[1.6rem] border border-t-0 border-[#D8E3EE] bg-white px-3 pb-3 pt-1 shadow-[0_18px_50px_rgba(1,12,45,0.18)] sm:px-3.5'
          : 'h-16 w-[min(100%,22rem)] rounded-[1.35rem] border border-white/20 p-2 shadow-[0_14px_38px_rgba(1,12,45,0.28)] hover:w-[min(100%,31rem)] hover:scale-[1.015] hover:shadow-[0_18px_46px_rgba(1,12,45,0.34)] focus-within:w-[min(100%,31rem)] focus-within:scale-[1.015]'
      }`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${etat === 'ouvert' ? 'bg-[#EBF5FF] ring-1 ring-[#DCEBFC]' : 'bg-white/95 shadow-sm'}`}>
        <Image src="/icone-doctorek.png" alt="" width={27} height={27} className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <label htmlFor="agent-message" className="sr-only">Votre demande de santé</label>
        <input
          id="agent-message"
          value={message}
          maxLength={500}
          onFocus={onOuvrir}
          onClick={onOuvrir}
          onChange={(event) => peutConverser && setMessage(event.target.value)}
          readOnly={!peutConverser}
          placeholder={peutConverser ? (etat === 'ouvert' ? "Dites-moi ce qu’il vous faut" : "Quel médecin recherchez-vous ?") : "Connectez-vous pour commencer"}
          className={`h-11 w-full bg-transparent px-1 text-[14px] font-medium outline-none placeholder:font-normal ${
            etat === 'ouvert'
              ? 'text-[#010C2D] placeholder:text-[#7B8C9F]'
              : 'text-white placeholder:text-[#B6DAF7]/75'
          }`}
        />
      </div>

      <button
        type="submit"
        disabled={!peutConverser || !message.trim() || enCours}
        aria-label="Envoyer"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#007DFF] text-white shadow-sm transition-all hover:bg-[#168AFF] disabled:text-white/45 focus-visible:outline-none focus-visible:ring-2 ${
          etat === 'ouvert'
            ? 'disabled:bg-[#DCEBFC] focus-visible:ring-[#007DFF]'
            : 'ring-1 ring-white/15 disabled:bg-white/15 focus-visible:ring-white'
        }`}
      >
        <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden="true" />
      </button>

      {etat !== 'ouvert' && (
        <button
          type="button"
          onClick={onReduire}
          aria-label="Réduire l'assistant"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Minus className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </form>
  )
}
