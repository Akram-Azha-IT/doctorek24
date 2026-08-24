'use client'

import { useCallback, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { describeError } from '@/lib/error-message'
import { ApiError } from '@/lib/api-client'
import type { AgentTour } from '@/lib/types'
import { getAgentStatut, postAgentChat } from './api'

/**
 * Disponibilité du module côté serveur.
 *
 * Requête unique par session : la configuration ne change pas en cours de route.
 */
export function useAgentStatut(actif: boolean) {
  return useQuery({
    queryKey: ['agent', 'statut'],
    queryFn: getAgentStatut,
    enabled: actif,
    staleTime: Infinity,
    retry: false,
  })
}

/**
 * Position du navigateur, demandée au dernier moment.
 *
 * La permission n'est sollicitée que lorsque le patient formule une demande de
 * proximité ; la lui réclamer à l'ouverture du chat serait intrusif et refusé.
 * Un refus n'est pas une erreur : l'assistant retombe sur la recherche par ville.
 */
function lirePosition(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null)
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 4000, maximumAge: 300_000 }
    )
  })
}

const MOTS_PROXIMITE = ['près de moi', 'pres de moi', 'proche', 'autour de moi', 'à côté', 'a cote']

function demandeProximite(message: string): boolean {
  const bas = message.toLowerCase()
  return MOTS_PROXIMITE.some((mot) => bas.includes(mot))
}

/**
 * Fil de conversation : état local des tours + envoi.
 *
 * L'historique fait autorité côté serveur (Redis, expiration 30 min) ; ce qui est
 * gardé ici ne sert qu'à l'affichage. Recharger la page repart d'un fil vide,
 * ce qui est le comportement attendu d'un widget d'assistance.
 */
export function useAgentConversation() {
  const [tours, setTours] = useState<AgentTour[]>([])
  const conversationId = useRef<string | null>(null)

  const mutation = useMutation({
    mutationFn: postAgentChat,
    onSuccess: (reponse) => {
      conversationId.current = reponse.conversationId
      setTours((precedents) => [
        ...precedents,
        {
          id: `${reponse.conversationId}-${precedents.length}`,
          role: 'assistant',
          texte: reponse.texte,
          cartes: reponse.cartes,
          outils: reponse.outilsAppeles,
        },
      ])
    },
    onError: (erreur) => {
      const texte = erreur instanceof ApiError && erreur.status === 503
        ? erreur.message
        : describeError(erreur).texte
      setTours((precedents) => [
        ...precedents,
        {
          id: `erreur-${precedents.length}`,
          role: 'assistant',
          texte,
          erreur: true,
        },
      ])
    },
  })

  const envoyer = useCallback(
    async (message: string) => {
      const texte = message.trim()
      if (!texte || mutation.isPending) return

      setTours((precedents) => [
        ...precedents,
        { id: `patient-${precedents.length}`, role: 'patient', texte },
      ])

      const position = demandeProximite(texte) ? await lirePosition() : null

      mutation.mutate({
        conversationId: conversationId.current,
        message: texte,
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
      })
    },
    [mutation]
  )

  const reinitialiser = useCallback(() => {
    conversationId.current = null
    setTours([])
  }, [])

  return { tours, envoyer, reinitialiser, enCours: mutation.isPending }
}
