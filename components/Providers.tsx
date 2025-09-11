"use client"

import { SessionProvider } from "next-auth/react"
import { ChatsProvider } from "@/context/ChatsContext"
import { TokensProvider } from "@/context/TokensContext"
import { ModelProvider } from "@/context/ModelContext"

export default function Providers({ children }: { children: React.ReactNode }) {
  // Lightweight heartbeat every 60s (client only)
  if (typeof window !== 'undefined') {
    ;(window as any).__aluda_heartbeat || ((window as any).__aluda_heartbeat = setInterval(() => {
      fetch('/api/admin/heartbeat', { method: 'POST' }).catch(() => {})
    }, 60000))
  }

  return (
    <SessionProvider>
      <ChatsProvider>
        <TokensProvider>
          <ModelProvider>{children}</ModelProvider>
        </TokensProvider>
      </ChatsProvider>
    </SessionProvider>
  )
}
