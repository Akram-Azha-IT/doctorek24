'use client'

import { useAutoRefresh } from './use-auto-refresh'

export function AutoRefreshProvider({ children }: { children: React.ReactNode }) {
  useAutoRefresh()
  return <>{children}</>
}
