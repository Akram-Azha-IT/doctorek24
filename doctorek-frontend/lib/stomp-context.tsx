'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SockJS = require('sockjs-client') as new (url: string) => WebSocket
import { getSession } from './session'
import { getTokenExpiry, refreshAccessToken } from './auth'

const STOMP_TOKEN_MARGIN_MS = 30_000

async function getValidAccessToken(): Promise<string | null> {
  let session = getSession()
  if (!session?.accessToken) return null

  const expiry = getTokenExpiry(session.accessToken)
  if (expiry !== null && expiry * 1000 <= Date.now() + STOMP_TOKEN_MARGIN_MS) {
    if (!(await refreshAccessToken())) return null
    session = getSession()
  }

  if (!session?.accessToken) return null
  const refreshedExpiry = getTokenExpiry(session.accessToken)
  if (refreshedExpiry !== null && refreshedExpiry * 1000 <= Date.now()) return null
  return session.accessToken
}

interface StompContextValue {
  connected: boolean
  subscribe: (destination: string, callback: (body: string) => void) => () => void
  publish: (destination: string, body: string) => boolean
}

const StompContext = createContext<StompContextValue>({
  connected: false,
  subscribe: () => () => {},
  publish: () => false,
})

export function useStompContext() {
  return useContext(StompContext)
}

export function StompProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<Client | null>(null)
  const [connected, setConnected] = useState(false)
  const subsRef = useRef<Map<string, Set<(body: string) => void>>>(new Map())
  const stompSubsRef = useRef<Map<string, { unsubscribe: () => void }>>(new Map())

  const applySubscriptions = useCallback((client: Client) => {
    stompSubsRef.current.forEach((sub) => sub.unsubscribe())
    stompSubsRef.current.clear()
    subsRef.current.forEach((callbacks, destination) => {
      if (callbacks.size === 0) return
      const stompSub = client.subscribe(destination, (frame) => {
        callbacks.forEach((cb) => cb(frame.body))
      })
      stompSubsRef.current.set(destination, stompSub)
    })
  }, [])

  useEffect(() => {
    function activate() {
      if (clientRef.current?.active) return

      const session = getSession()
      if (!session?.accessToken) return

      const client = new Client({
        webSocketFactory: () =>
          new SockJS(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/ws`),
        reconnectDelay: 5000,
        beforeConnect: async () => {
          const accessToken = await getValidAccessToken()
          if (!accessToken) {
            setConnected(false)
            await client.deactivate()
            return
          }
          client.connectHeaders = { Authorization: `Bearer ${accessToken}` }
        },
        onConnect: () => {
          setConnected(true)
          applySubscriptions(client)
        },
        onDisconnect: () => setConnected(false),
        onStompError: async (frame) => {
          setConnected(false)
          const msg = frame.headers?.message ?? ''
          if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('expired')) {
            const refreshed = await refreshAccessToken()
            if (!refreshed) await client.deactivate()
          }
        },
      })

      client.activate()
      clientRef.current = client
    }

    activate()
    window.addEventListener('session-updated', activate)

    return () => {
      window.removeEventListener('session-updated', activate)
      clientRef.current?.deactivate()
      clientRef.current = null
      setConnected(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subscribe = useCallback((destination: string, callback: (body: string) => void) => {
    if (!subsRef.current.has(destination)) {
      subsRef.current.set(destination, new Set())
    }
    subsRef.current.get(destination)!.add(callback)

    const client = clientRef.current
    if (client?.connected && !stompSubsRef.current.has(destination)) {
      const stompSub = client.subscribe(destination, (frame) => {
        subsRef.current.get(destination)?.forEach((cb) => cb(frame.body))
      })
      stompSubsRef.current.set(destination, stompSub)
    }

    return () => {
      subsRef.current.get(destination)?.delete(callback)
      if (subsRef.current.get(destination)?.size === 0) {
        stompSubsRef.current.get(destination)?.unsubscribe()
        stompSubsRef.current.delete(destination)
        subsRef.current.delete(destination)
      }
    }
  }, [])

  const publish = useCallback((destination: string, body: string): boolean => {
    const client = clientRef.current
    if (!client?.connected) return false
    client.publish({ destination, body })
    return true
  }, [])

  return (
    <StompContext.Provider value={{ connected, subscribe, publish }}>
      {children}
    </StompContext.Provider>
  )
}
