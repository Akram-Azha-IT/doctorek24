import { ApiError } from './api-client'

export interface FriendlyError {
  titre: string
  texte: string
  /** true = panne réseau/serveur, un simple « Réessayer » peut suffire. */
  recuperable: boolean
}

/**
 * Traduit une erreur technique (fetch/ApiError) en message utilisateur clair,
 * en français. Jamais de « Failed to fetch » brut à l'écran.
 */
export function describeError(error: unknown): FriendlyError {
  // Panne réseau : backend injoignable, coupure internet. fetch() lève un TypeError.
  if (error instanceof TypeError || (error instanceof Error && error.name === 'TypeError')) {
    return {
      titre: 'Connexion au serveur impossible',
      texte:
        "Nous n'arrivons pas à joindre nos serveurs. Vérifiez votre connexion internet, puis réessayez.",
      recuperable: true,
    }
  }

  if (error instanceof ApiError) {
    if (error.status >= 500) {
      return {
        titre: 'Le serveur rencontre un problème',
        texte: "Ce n'est pas de votre faute. Merci de réessayer dans quelques instants.",
        recuperable: true,
      }
    }
    if (error.status === 404) {
      return {
        titre: 'Introuvable',
        texte: "La ressource demandée n'existe pas ou a été déplacée.",
        recuperable: false,
      }
    }
    // 4xx métier : le backend renvoie un message français exploitable
    return {
      titre: 'Une erreur est survenue',
      texte: error.message || "La requête n'a pas pu aboutir.",
      recuperable: true,
    }
  }

  return {
    titre: 'Une erreur inattendue est survenue',
    texte: 'Merci de réessayer. Si le problème persiste, contactez le support.',
    recuperable: true,
  }
}
