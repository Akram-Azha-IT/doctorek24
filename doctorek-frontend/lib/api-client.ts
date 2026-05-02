import type { ApiResponse } from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const body: ApiResponse<T> = await res.json()
  if (!body.success || !res.ok) {
    throw new Error(body.message ?? `HTTP ${res.status}`)
  }
  return body.data as T
}
