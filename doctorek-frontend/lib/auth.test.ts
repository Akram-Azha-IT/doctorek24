import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getAuthSession, setCachedSession } = vi.hoisted(() => ({
  getAuthSession: vi.fn(),
  setCachedSession: vi.fn(),
}))

vi.mock('next-auth/react', () => ({ getSession: getAuthSession }))
vi.mock('./session', () => ({ __setCachedSession: setCachedSession }))

import { refreshAccessToken } from './auth'

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects and clears an Auth.js session whose refresh failed', async () => {
    getAuthSession.mockResolvedValue({
      error: 'RefreshFailed',
      accessToken: 'expired-token',
      user: { id: 'doctor-1', role: 'MEDECIN', email: 'doctor@example.test' },
    })

    await expect(refreshAccessToken()).resolves.toBe(false)
    expect(setCachedSession).toHaveBeenCalledWith(null)
  })

  it('mirrors a valid refreshed session into the synchronous cache', async () => {
    getAuthSession.mockResolvedValue({
      accessToken: 'fresh-token',
      user: { id: 'doctor-1', role: 'MEDECIN', email: 'doctor@example.test' },
    })

    await expect(refreshAccessToken()).resolves.toBe(true)
    expect(setCachedSession).toHaveBeenCalledWith({
      role: 'MEDECIN',
      id: 'doctor-1',
      email: 'doctor@example.test',
      accessToken: 'fresh-token',
      refreshToken: null,
    })
  })
})
