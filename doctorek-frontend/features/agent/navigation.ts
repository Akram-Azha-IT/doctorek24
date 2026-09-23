const AGENT_RETURN_PARAM = 'assistant'
const AGENT_RETURN_VALUE = 'ouvert'

export type AgentSurface = 'masque' | 'contextuel' | 'lanceur'
export type AgentRole = 'PATIENT' | 'MEDECIN' | 'ADMIN' | null

const ROUTES_SENSIBLES = [
  '/login',
  '/inscription',
  '/dashboard/redirect',
] as const

/**
 * Politique produit de présence de l'assistant patient.
 *
 * `contextuel` garde le widget monté pour les CTA intégrés à la page, mais ne
 * montre pas de bulle spontanée. Le portail médecin devra disposer d'un futur
 * copilote distinct : il ne doit jamais hériter des outils ou du discours du
 * parcours patient.
 */
export function agentSurface(pathname: string, role: AgentRole): AgentSurface {
  if (
    ROUTES_SENSIBLES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
    || pathname === '/carte'
    || pathname.startsWith('/carte/')
    || pathname.startsWith('/dashboard/medecin')
    || pathname.startsWith('/dashboard/admin')
    || role === 'MEDECIN'
    || role === 'ADMIN'
  ) return 'masque'

  if (role === 'PATIENT') {
    if (
      pathname.startsWith('/dashboard/patient/messages')
      || /^\/medecins\/[^/]+\/rdv(?:\/|$)/.test(pathname)
    ) return 'masque'
    return 'lanceur'
  }

  // Sans session, la page d'accueil possède déjà ses propres CTA. Le widget
  // écoute leur événement sans ajouter une seconde entrée flottante.
  if (pathname === '/') return 'contextuel'

  // Sur les pages de découverte, la bulle mène vers l'accès patient puis
  // restaure exactement la recherche ou la fiche consultée après connexion.
  if (pathname === '/recherche' || /^\/medecins\/[^/]+$/.test(pathname)) {
    return 'lanceur'
  }

  return 'masque'
}

/** Construit la destination à restaurer après la connexion sans perdre les filtres de la page. */
export function buildAgentReturnPath(pathname: string, search = ''): string {
  const params = new URLSearchParams(search)
  params.set(AGENT_RETURN_PARAM, AGENT_RETURN_VALUE)
  return `${pathname}?${params.toString()}`
}

/** Passe l'intention de retour au flux Keycloak déjà pris en charge par /login. */
export function buildAgentLoginHref(returnPath: string): string {
  return `/login?redirect=${encodeURIComponent(returnPath)}`
}

export function shouldOpenAgent(search: string): boolean {
  return new URLSearchParams(search).get(AGENT_RETURN_PARAM) === AGENT_RETURN_VALUE
}

/** Nettoie le marqueur temporaire une fois que le panneau a été rouvert. */
export function removeAgentReturnMarker(pathname: string, search: string): string {
  const params = new URLSearchParams(search)
  params.delete(AGENT_RETURN_PARAM)
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}
