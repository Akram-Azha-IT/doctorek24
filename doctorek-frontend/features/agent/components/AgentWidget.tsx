'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { BookingDrawer } from '@/features/agenda/components/BookingDrawer'
import { getMedecin } from '@/features/annuaire/api'
import { useSession } from '@/lib/useSession'
import type { AgentRdvBrouillon, BookingSlot } from '@/lib/types'
import { useAgentConversation, useAgentStatut } from '../hooks'
import { OPEN_AGENT_EVENT } from '../events'
import { AgentLauncher, type EtatAgent } from './AgentLauncher'
import { AgentPanel } from './AgentPanel'
import { finDuCreneau } from './AgentCartes'
import {
  buildAgentLoginHref,
  buildAgentReturnPath,
  agentSurface,
  removeAgentReturnMarker,
  shouldOpenAgent,
} from '../navigation'

/**
 * Point de montage de l'assistant, posé une fois dans la mise en page racine.
 *
 * <h3>Conditions d'affichage</h3>
 * Visible sur les surfaces autorisées du parcours patient quand un modèle est
 * configuré. Les visiteurs des pages de découverte voient l'étape d'accès ;
 * les espaces médecin, administrateur et les parcours sensibles sont exclus.
 *
 * <h3>Passage de relais</h3>
 * L'assistant ne réserve jamais. Un clic sur un créneau ou sur la proposition
 * de rendez-vous ouvre le tiroir de réservation déjà utilisé par la recherche
 * et la fiche praticien : contrôle du compte famille, questionnaire, e-mail de
 * confirmation et notification du médecin restent sur le chemin éprouvé.
 */
export function AgentWidget() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const ouvrirApresConnexion = shouldOpenAgent(search)
  const loginHref = buildAgentLoginHref(buildAgentReturnPath(pathname, search))
  const session = useSession()
  const estPatient = session?.role === 'PATIENT'
  const surface = agentSurface(pathname, session?.role ?? null)

  const { data: statut } = useAgentStatut(surface !== 'masque')
  const { tours, envoyer, reinitialiser, enCours } = useAgentConversation()

  const [etat, setEtat] = useState<EtatAgent>(
    ouvrirApresConnexion ? 'ouvert' : 'minimise'
  )
  const [slot, setSlot] = useState<BookingSlot | null>(null)

  useEffect(() => {
    const ouvrir = () => setEtat('ouvert')
    window.addEventListener(OPEN_AGENT_EVENT, ouvrir)
    return () => window.removeEventListener(OPEN_AGENT_EVENT, ouvrir)
  }, [])

  useEffect(() => {
    if (!ouvrirApresConnexion) return

    const ouverture = window.setTimeout(() => {
      setEtat('ouvert')
      window.history.replaceState(
        window.history.state,
        '',
        `${removeAgentReturnMarker(pathname, search)}${window.location.hash}`
      )
    }, 0)

    return () => window.clearTimeout(ouverture)
  }, [ouvrirApresConnexion, pathname, search])

  const ouvrirEtEnvoyer = useCallback(
    (message: string) => {
      setEtat('ouvert')
      if (!estPatient) return
      void envoyer(message)
    },
    [envoyer, estPatient]
  )

  /**
   * Le brouillon ne porte que l'identifiant du praticien : le tiroir attend un
   * profil complet. On le charge au clic, pas avant, pour ne pas payer une
   * requête à chaque proposition affichée.
   */
  const ouvrirDepuisBrouillon = useCallback(async (brouillon: AgentRdvBrouillon) => {
    try {
      const medecin = await getMedecin(brouillon.medecinId)
      setSlot({
        medecin,
        date: brouillon.date,
        debut: brouillon.heure,
        fin: finDuCreneau(brouillon.heure, brouillon.dureeMinutes),
      })
    } catch {
      // Le tiroir ne s'ouvre pas : la carte reste affichée, le patient peut
      // passer par la fiche du praticien. Rien n'est perdu.
    }
  }, [])

  if (surface === 'masque' || !statut?.disponible) return null

  const afficherLanceur = surface === 'lanceur' || etat === 'ouvert'
  const navigationPatientMobile = pathname.startsWith('/dashboard/patient')

  return (
    <>
      {etat === 'ouvert' && (
        <button
          type="button"
          aria-label="Fermer l’assistant"
          onClick={() => setEtat('minimise')}
          className="agent-voile fixed inset-0 z-[55] cursor-default bg-[#010C2D]/15 backdrop-blur-[1px]"
        />
      )}

      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col px-3 sm:px-4 lg:px-6 lg:pb-6 ${
          navigationPatientMobile
            ? 'pb-[calc(env(safe-area-inset-bottom)+4.75rem)]'
            : 'pb-[calc(env(safe-area-inset-bottom)+1rem)]'
        } ${
          etat === 'minimise' ? 'items-end' : 'items-center sm:items-end'
        } ${etat === 'ouvert' ? 'gap-0' : 'gap-3'}`}
      >
        {etat === 'ouvert' && (
          <AgentPanel
            acces={estPatient ? 'patient' : session ? 'autre-role' : 'anonyme'}
            loginHref={loginHref}
            tours={tours}
            enCours={enCours}
            onEnvoyer={envoyer}
            onFermer={() => setEtat('minimise')}
            onReinitialiser={reinitialiser}
            onReserver={setSlot}
            onBrouillon={ouvrirDepuisBrouillon}
          />
        )}

        {afficherLanceur && (estPatient || etat !== 'ouvert') && (
          <AgentLauncher
            etat={etat}
            onEtendre={() => setEtat('ouvert')}
            onOuvrir={() => setEtat('ouvert')}
            onReduire={() => setEtat('minimise')}
            onEnvoyer={ouvrirEtEnvoyer}
            enCours={enCours}
            peutConverser={estPatient}
            transcriptionDisponible={Boolean(statut?.transcriptionDisponible)}
          />
        )}
      </div>

      <BookingDrawer slot={slot} onClose={() => setSlot(null)} />
    </>
  )
}
