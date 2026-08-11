import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { StatutAvis } from '@/lib/types'
import {
  creerAvis,
  getAvisMedecin,
  getFileModeration,
  getNotesMedecins,
  getRdvsNotables,
  modererAvis,
  signalerAvis,
  type CreerAvisPayload,
} from './api'

export function useAvisMedecin(medecinId: string, page = 1) {
  return useQuery({
    queryKey: ['avis', 'medecin', medecinId, page],
    queryFn: () => getAvisMedecin(medecinId, page),
    enabled: !!medecinId,
    staleTime: 60_000,
  })
}

/**
 * Notes des médecins affichés, en une requête pour toute la page.
 *
 * Une requête par carte suivrait la pagination et saturerait l'API ; la clé porte
 * donc les identifiants de la page courante.
 */
export function useNotesMedecins(medecinIds: string[]) {
  // Tri uniquement pour rendre la clé de cache stable quel que soit l'ordre d'affichage.
  const ids = [...new Set(medecinIds)].sort((a, b) => a.localeCompare(b))
  return useQuery({
    queryKey: ['avis', 'notes', ids.join(',')],
    queryFn: () => getNotesMedecins(ids),
    enabled: ids.length > 0,
    staleTime: 60_000,
    select: (notes) => new Map(notes.map((n) => [n.medecinId, n])),
  })
}

export function useCreerAvis(medecinId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreerAvisPayload) => creerAvis(payload),
    onSuccess: () => {
      // La moyenne et la répartition changent avec l'avis : recharger la page d'avis,
      // et la liste des rendez-vous notables d'où part le bouton.
      queryClient.invalidateQueries({ queryKey: ['avis', 'medecin', medecinId] })
      queryClient.invalidateQueries({ queryKey: ['avis', 'notables'] })
    },
  })
}

/**
 * Rendez-vous encore notables parmi ceux affichés.
 *
 * La clé inclut les identifiants : changer de page de rendez-vous doit relancer
 * la question plutôt que réafficher le verdict de la page précédente.
 */
export function useRdvsNotables(rdvIds: string[]) {
  const cle = [...rdvIds].sort((a, b) => a.localeCompare(b)).join(',')
  return useQuery({
    queryKey: ['avis', 'notables', cle],
    queryFn: () => getRdvsNotables(rdvIds),
    enabled: rdvIds.length > 0,
    staleTime: 30_000,
  })
}

export function useSignalerAvis(medecinId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ avisId, motif }: { avisId: string; motif?: string }) =>
      signalerAvis(avisId, motif),
    onSuccess: () => {
      if (medecinId) {
        queryClient.invalidateQueries({ queryKey: ['avis', 'medecin', medecinId] })
      }
      queryClient.invalidateQueries({ queryKey: ['avis', 'moderation'] })
    },
  })
}

export function useFileModeration(page = 1) {
  return useQuery({
    queryKey: ['avis', 'moderation', page],
    queryFn: () => getFileModeration(page),
    staleTime: 15_000,
  })
}

export function useModererAvis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ avisId, statut }: { avisId: string; statut: StatutAvis }) =>
      modererAvis(avisId, statut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avis'] })
    },
  })
}
