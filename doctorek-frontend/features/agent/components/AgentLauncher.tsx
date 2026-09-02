'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { ArrowUp, Mic, Minus, Square, X } from 'lucide-react'
import { useAgentVoiceRecorder } from '../useAgentVoiceRecorder'

export type EtatAgent = 'minimise' | 'barre' | 'ouvert'

const LONGUEUR_MAX_MESSAGE = 500

interface AgentLauncherProps {
  readonly etat: EtatAgent
  readonly onEtendre: () => void
  readonly onOuvrir: () => void
  readonly onReduire: () => void
  readonly onEnvoyer: (message: string) => void
  readonly enCours: boolean
  readonly peutConverser: boolean
  readonly transcriptionDisponible: boolean
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
  transcriptionDisponible,
}: AgentLauncherProps) {
  const [message, setMessage] = useState('')
  const [alerteDictee, setAlerteDictee] = useState<string | null>(null)
  const integrerTranscription = useCallback((texte: string) => {
    setMessage((brouillon) => {
      const combine = `${brouillon.trim()}${brouillon.trim() ? ' ' : ''}${texte.trim()}`
      if (combine.length > LONGUEUR_MAX_MESSAGE) {
        setAlerteDictee('La dictée dépasse 500 caractères. La fin a été coupée.')
      }
      return combine.slice(0, LONGUEUR_MAX_MESSAGE)
    })
  }, [])
  const dictee = useAgentVoiceRecorder({
    actif: peutConverser && transcriptionDisponible && etat !== 'minimise',
    onTranscription: integrerTranscription,
  })
  const dicteeOccupee = dictee.etat !== 'repos'

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
      className={`agent-barre ${etat === 'ouvert' ? 'agent-barre-ouverte' : ''} pointer-events-auto relative flex origin-center items-center gap-2 transition-[width,transform,box-shadow] duration-300 ease-out focus-within:shadow-[0_18px_46px_rgba(1,12,45,0.24)] ${
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
        {dictee.etat === 'enregistrement' ? (
          <div className={`flex h-11 items-center gap-2 px-1 ${etat === 'ouvert' ? 'text-[#010C2D]' : 'text-white'}`} role="status" aria-live="polite">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#E01E5A] shadow-[0_0_0_4px_rgba(224,30,90,0.12)]" aria-hidden="true" />
            <span className="agent-onde-vocale flex h-6 items-center gap-[3px]" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((barre) => <i key={barre} />)}
            </span>
            <span className="truncate text-[13px] font-semibold">À l’écoute</span>
            <span aria-hidden="true" className="ml-auto font-mono text-[12px] tabular-nums opacity-70">0:{String(dictee.secondes).padStart(2, '0')}</span>
          </div>
        ) : dictee.etat === 'autorisation' || dictee.etat === 'transcription' ? (
          <div className={`flex h-11 items-center gap-2 px-1 text-[13px] font-semibold ${etat === 'ouvert' ? 'text-[#53677B]' : 'text-white/85'}`} role="status">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
            {dictee.etat === 'autorisation' ? 'Activation du micro…' : 'Transcription…'}
          </div>
        ) : (
          <input
            id="agent-message"
            value={message}
            maxLength={LONGUEUR_MAX_MESSAGE}
            onFocus={onOuvrir}
            onClick={onOuvrir}
            onChange={(event) => {
              if (peutConverser) {
                setAlerteDictee(null)
                setMessage(event.target.value)
              }
            }}
            readOnly={!peutConverser}
            placeholder={peutConverser ? (etat === 'ouvert' ? "Dites-moi ce qu’il vous faut" : "Quel médecin recherchez-vous ?") : "Connectez-vous pour commencer"}
            className={`h-11 w-full bg-transparent px-1 text-[14px] font-medium outline-none placeholder:font-normal ${
              etat === 'ouvert'
                ? 'text-[#010C2D] placeholder:text-[#7B8C9F]'
                : 'text-white placeholder:text-[#B6DAF7]/75'
            }`}
          />
        )}
      </div>

      {dictee.etat === 'enregistrement' ? (
        <>
          <button type="button" onClick={dictee.annuler} aria-label="Annuler l'enregistrement" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 ${etat === 'ouvert' ? 'bg-[#F1F6FD] text-[#526274] hover:bg-[#E3EEF9] focus-visible:ring-[#007DFF]' : 'bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white'}`}>
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <button type="button" onClick={dictee.arreter} aria-label="Arrêter et transcrire" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00263C] text-white shadow-[0_5px_16px_rgba(0,38,60,0.24)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFF] focus-visible:ring-offset-2">
            <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          </button>
        </>
      ) : (
        <>
          {dictee.supporte && (
            <button
              type="button"
              onClick={() => { onOuvrir(); void dictee.commencer() }}
              disabled={dicteeOccupee || enCours}
              aria-label="Démarrer la dictée vocale"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 ${
                etat === 'ouvert'
                  ? 'bg-[#F1F6FD] text-[#00263C] hover:bg-[#E3EEF9] hover:text-[#007DFF] focus-visible:ring-[#007DFF]'
                  : 'bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white'
              } disabled:opacity-45`}
            >
              <Mic className="h-[19px] w-[19px]" strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
          <button
            type="submit"
            disabled={!peutConverser || !message.trim() || enCours || dicteeOccupee}
            aria-label="Envoyer"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#007DFF] text-white shadow-sm transition-all hover:bg-[#168AFF] disabled:text-white/45 focus-visible:outline-none focus-visible:ring-2 ${
              etat === 'ouvert'
                ? 'disabled:bg-[#DCEBFC] focus-visible:ring-[#007DFF]'
                : 'ring-1 ring-white/15 disabled:bg-white/15 focus-visible:ring-white'
            }`}
          >
            <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden="true" />
          </button>
        </>
      )}

      {etat !== 'ouvert' && (
        <button
          type="button"
          onClick={() => {
            dictee.annuler()
            onReduire()
          }}
          aria-label="Réduire l'assistant"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/80 ring-1 ring-white/10 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Minus className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
        </button>
      )}

      {(dictee.erreur || alerteDictee) && (
        <p role="alert" className="absolute bottom-[calc(100%+0.5rem)] left-2 right-2 rounded-xl border border-[#F7B7CA] bg-white px-3 py-2 text-center text-[11.5px] font-medium text-[#C91D50] shadow-lg">
          {dictee.erreur ?? alerteDictee}
        </p>
      )}
    </form>
  )
}
