import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Providers from "@/components/Providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AludaAI - AI ასისტენტი ქართულ ენაზე",
  description: "თქვენი AI ასისტენტი ქართულ ენაზე Flowise-ზე დაფუძნებული",
  icons: {
    icon: [
      { url: '/brain-icon.svg', type: 'image/svg+xml' },
      { url: '/aludaicon.webp', type: 'image/webp' },
      { url: '/logo.webp', type: 'image/webp' },
    ],
    shortcut: '/brain-icon.svg',
    apple: '/aludaicon.webp',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ka">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
