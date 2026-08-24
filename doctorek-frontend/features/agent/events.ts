export const OPEN_AGENT_EVENT = 'doctorek:open-agent'

export function openAgent() {
  window.dispatchEvent(new Event(OPEN_AGENT_EVENT))
}
