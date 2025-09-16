import type { Metadata, Viewport } from "next"
import { Inter, Caveat, Dancing_Script, Pacifico } from "next/font/google"
import "./globals.css"
import Providers from "@/components/Providers"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })
const caveat = Caveat({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-handwriting"
})
const dancingScript = Dancing_Script({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dancing"
})
const pacifico = Pacifico({ 
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico"
})

export const metadata: Metadata = {
  title: "AludaAI - ქართული AI ჩათ-ასისტენტი | უფასო ხელოვნური ინტელექტი",
  description: "AludaAI არის ქართული AI ჩათ-ასისტენტი, რომელიც ეხმარება ქართველ მომხმარებლებს ყოველდღიურ ამოცანებში. უფასო, უსაფრთხო და მარტივი გამოყენების AI ასისტენტი.",
  keywords: "AludaAI, ხელოვნური ინტელექტი, AI, ჩათ-ბოტი, ქართული, საქართველო, უფასო, AI ასისტენტი, ქართული AI, ChatGPT ქართულად",
  openGraph: {
    title: "AludaAI - ქართული AI ჩათ-ასისტენტი",
    description: "უფასო ქართული AI ჩათ-ასისტენტი ყველა ქართველი მომხმარებლისთვის. უსაფრთხო და მარტივი გამოყენების AI ასისტენტი.",
    type: "website",
    locale: "ka_GE",
    siteName: "AludaAI",
  },
  twitter: {
    card: "summary_large_image",
    title: "AludaAI - ქართული AI ჩათ-ასისტენტი",
    description: "უფასო ქართული AI ჩათ-ასისტენტი ყველა ქართველი მომხმარებლისთვის.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://aluda.app",
  },
  icons: {
    icon: [
      { url: '/brain-icon.svg', type: 'image/svg+xml' },
      { url: '/aludaicon.webp', type: 'image/webp' },
    ],
    shortcut: '/brain-icon.svg',
    apple: '/brain-icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ka">
      <body className={`${inter.className} ${caveat.variable} ${dancingScript.variable} ${pacifico.variable}`}>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
