"use client"

import React, { createContext, useContext, useMemo } from 'react'
import { useChats } from '@/hooks/useChats'

type ChatsContextValue = ReturnType<typeof useChats>

const ChatsContext = createContext<ChatsContextValue | null>(null)

export function ChatsProvider({ children }: { children: React.ReactNode }) {
  const value = useChats()
  const memo = useMemo(() => value, [
    value.chats,
    value.currentChatId,
    value.currentChat,
    value.currentChatMessages,
    value.isInitialized,
  ])
  return <ChatsContext.Provider value={memo}>{children}</ChatsContext.Provider>
}

export function useChatsContext(): ChatsContextValue {
  const ctx = useContext(ChatsContext)
  if (!ctx) throw new Error('useChatsContext must be used within ChatsProvider')
  return ctx
}


