import { describe, expect, test, vi } from 'vitest'
import { OPEN_AGENT_EVENT, openAgent } from './events'

describe('openAgent', () => {
  test('notifie le widget pour ouvrir le panneau complet', () => {
    const ouvrir = vi.fn()
    window.addEventListener(OPEN_AGENT_EVENT, ouvrir)

    openAgent()

    expect(ouvrir).toHaveBeenCalledOnce()
    window.removeEventListener(OPEN_AGENT_EVENT, ouvrir)
  })
})
