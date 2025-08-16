"use client"

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type ModelType = 'mini' | 'aluda2'

type ModelContextValue = {
  model: ModelType
  setModel: (m: ModelType) => void
}

const ModelContext = createContext<ModelContextValue | null>(null)

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [model, setModelState] = useState<ModelType>('mini')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aluda_model') as ModelType | null
      if (saved === 'mini' || saved === 'aluda2') setModelState(saved)
    } catch {}
  }, [])

  const setModel = useCallback((m: ModelType) => {
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


