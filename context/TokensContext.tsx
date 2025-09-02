"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type Usage = { daily: number; monthly: number; images: number }
type Limits = { daily: number; monthly: number; images: number }
type Actor = { type: 'guest' | 'user'; plan?: 'USER' | 'PREMIUM' }

type TokensContextValue = {
  usage: Usage
  limits: Limits
  actor?: Actor
  refresh: () => Promise<void>
  setUsageLimits: (next: { usage: Usage; limits: Limits }) => void
}

const TokensContext = createContext<TokensContextValue | null>(null)

export function TokensProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [usage, setUsage] = useState<Usage>({ daily: 0, monthly: 0, images: 0 })
  const [limits, setLimits] = useState<Limits>({ daily: 0, monthly: 0, images: 0 })
  const [actor, setActor] = useState<Actor | undefined>(undefined)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/tokens', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setUsage(data.usage || { daily: 0, monthly: 0, images: 0 })
      setLimits(data.limits || { daily: 0, monthly: 0, images: 0 })
      if (data.actor) setActor(data.actor)
    } catch {}
  }, [])

  const setUsageLimits = useCallback((next: { usage: Usage; limits: Limits }) => {
    setUsage(next.usage)
    setLimits(next.limits)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // IMPORTANT: Re-fetch tokens/actor whenever auth status changes.
  // This ensures that immediately after sign-in, premium plan reflects in the UI
  // (e.g., enabling Aluda 2.0 without requiring any manual action).
  useEffect(() => {
    if (status && status !== 'loading') {
      refresh()
    }
  }, [status, refresh])

  return (
    <TokensContext.Provider value={{ usage, limits, actor, refresh, setUsageLimits }}>
      {children}
    </TokensContext.Provider>
  )
}

export function useTokens() {
  const ctx = useContext(TokensContext)
  if (!ctx) throw new Error('useTokens must be used within TokensProvider')
  return ctx
}


