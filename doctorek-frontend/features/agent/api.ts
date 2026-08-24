import { apiFetch } from '@/lib/api-client'
import type { AgentChatResponse } from '@/lib/types'

export interface AgentChatPayload {
  /** Identifiant de fil renvoyé par le tour précédent. Absent au premier message. */
  conversationId?: string | null
  message: string
  /**
   * Position du navigateur, uniquement si le patient l'a accordée.
   * Elle vient d'ici et jamais du modèle : c'est ce qui permet à l'outil
   * de proximité de fonctionner sans qu'une position puisse être forgée.
   */
  latitude?: number | null
  longitude?: number | null
}

export function postAgentChat(payload: AgentChatPayload): Promise<AgentChatResponse> {
  return apiFetch<AgentChatResponse>('/api/v1/agent/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Indique si un modèle est branché côté serveur.
 *
 * L'assistant est un module optionnel : sans clé API configurée, l'endpoint de
 * chat répond 503. On masque alors le lanceur plutôt que d'offrir un bouton mort.
 */
export function getAgentStatut(): Promise<{ disponible: boolean }> {
  return apiFetch<{ disponible: boolean }>('/api/v1/agent/statut')
}
