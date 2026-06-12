'use client'

import { useEffect } from 'react'
import { getSession, clearSession } from './session'
import { refreshAccessToken, getTokenExpiry } from './auth'

const REFRESH_BEFORE_EXPIRY_MS = 60_000 // refresh 60 s before token expires

export function useAutoRefresh() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    async function scheduleNext() {
      if (timer) clearTimeout(timer)

      const session = getSession()
      if (!session?.accessToken) return

      const exp = getTokenExpiry(session.accessToken)
      if (!exp) return

      const nowMs = Date.now()
      const expiresInMs = exp * 1000 - nowMs
      const refreshInMs = Math.max(0, expiresInMs - REFRESH_BEFORE_EXPIRY_MS)

      if (expiresInMs <= 0) {
        // Already expired — refresh immediately
        const ok = await refreshAccessToken()
        if (!ok) {
          clearSession()
          window.location.href = `/login?expired=1&redirect=${encodeURIComponent(window.location.pathname)}`
        } else {
          scheduleNext()
        }
        return
      }

      timer = setTimeout(async () => {
        const ok = await refreshAccessToken()
        if (!ok) {
          clearSession()
          window.location.href = `/login?expired=1&redirect=${encodeURIComponent(window.location.pathname)}`
        } else {
          scheduleNext()
        }
      }, refreshInMs)
    }

    scheduleNext()

    // Re-schedule whenever session changes (new login, manual token update)
    window.addEventListener('session-updated', scheduleNext)
    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('session-updated', scheduleNext)
    }
  }, [])
}
