import type { ApiResponse } from './types'
import { getSession, clearSession } from './session'
import { refreshAccessToken } from './auth'

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

const BASE = process.env.NEXT_PUBLIC_API_URL
export const DEFAULT_API_TIMEOUT_MS = 10_000

export interface ApiRequestInit extends RequestInit {
  /** Durée maximale d'une tentative. Les traitements longs peuvent l'augmenter explicitement. */
  timeoutMs?: number
}

// Singleton refresh promise — prevents concurrent refresh calls consuming the one-time refresh token
let refreshingPromise: Promise<boolean> | null = null

function buildHeaders(init?: RequestInit): Record<string, string> {
  const session = typeof window !== 'undefined' ? getSession() : null
  const formDataBody = typeof FormData !== 'undefined' && init?.body instanceof FormData
  const headers: Record<string, string> = {
    ...(formDataBody ? {} : { 'Content-Type': 'application/json' }),
    ...(init?.headers as Record<string, string> | undefined),
  }
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`
  }
  return headers
}

async function doFetch(path: string, init?: ApiRequestInit): Promise<Response> {
  const { timeoutMs = DEFAULT_API_TIMEOUT_MS, ...requestInit } = init ?? {}
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const signal = requestInit.signal
    ? AbortSignal.any([requestInit.signal, timeoutSignal])
    : timeoutSignal

  try {
    return await fetch(`${BASE}${path}`, {
      ...requestInit,
      headers: buildHeaders(requestInit),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new TypeError('API request timed out', { cause: error })
    }
    throw error
  }
}

function redirectToLogin() {
  clearSession()
  if (typeof window === 'undefined') return
  const redirect = encodeURIComponent(window.location.pathname)
  window.location.href = `/login?expired=1&redirect=${redirect}`
}

export async function apiFetch<T>(path: string, init?: ApiRequestInit): Promise<T> {
  let res = await doFetch(path, init)

  if (res.status === 401 && typeof window !== 'undefined') {
    if (!refreshingPromise) {
      refreshingPromise = refreshAccessToken().finally(() => {
        refreshingPromise = null
      })
    }
    const refreshed = await refreshingPromise

    if (refreshed) {
      res = await doFetch(path, init)
    }

    if (res.status === 401) {
      redirectToLogin()
      throw new ApiError('Session expirée. Veuillez vous reconnecter.', 401)
    }
  }

  const body: ApiResponse<T> = await res.json()
  if (!body.success || !res.ok) {
    throw new ApiError(body.message ?? `HTTP ${res.status}`, res.status)
  }
  return body.data as T
}
