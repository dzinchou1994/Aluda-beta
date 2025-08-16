"use client"

import { SessionProvider } from "next-auth/react"
import { ChatsProvider } from "@/context/ChatsContext"
import { TokensProvider } from "@/context/TokensContext"
import { ModelProvider } from "@/context/ModelContext"

export default function Providers({ children }: { children: React.ReactNode }) {
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
