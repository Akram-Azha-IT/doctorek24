const AGENT_RETURN_PARAM = 'assistant'
const AGENT_RETURN_VALUE = 'ouvert'

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
