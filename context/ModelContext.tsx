"use client"

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type ModelType = 'mini' | 'aluda2' | 'test'

type ModelContextValue = {
  model: ModelType
  setModel: (m: ModelType) => void
}

const ModelContext = createContext<ModelContextValue | null>(null)

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [model, setModelState] = useState<ModelType>('mini')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aluda_model') as ModelType | null
      if (saved === 'mini' || saved === 'aluda2' || saved === 'test') setModelState(saved)
    } catch {}
    setInitialized(true)
  }, [])

  const setModel = useCallback((m: ModelType) => {
    // Guard: prevent non-premium/guest persisting aluda2 without server confirmation.
    // The server will also enforce, but we keep UI consistent. We allow setting here;
    // ModelSwitcher will route guests/users without premium to upgrade.
    setModelState(m)
    try { localStorage.setItem('aluda_model', m) } catch {}
  }, [])

  return (
    <ModelContext.Provider value={{ model, setModel }}>
      {children}
    </ModelContext.Provider>
  )
}

export function useModel() {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModel must be used within ModelProvider')
  return ctx
}


