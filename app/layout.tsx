import type { Metadata, Viewport } from "next"
import { Inter, Caveat, Dancing_Script, Pacifico } from "next/font/google"
import "./globals.css"
import Providers from "@/components/Providers"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"
import GoogleTagManager from "@/components/GoogleTagManager"

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
  title: "Aluda - პირველი ქართული AI პლატფორმა",
  description: "AludaAI არის ქართული AI ჩათ-ასისტენტი, რომელიც ეხმარება ქართველ მომხმარებლებს ყოველდღიურ ამოცანებში. უფასო, უსაფრთხო და მარტივი გამოყენების AI ასისტენტი.",
  keywords: "AludaAI, ხელოვნური ინტელექტი, AI, ჩათ-ბოტი, ქართული, საქართველო, უფასო, AI ასისტენტი, ქართული AI, ChatGPT ქართულად",
  openGraph: {
    title: "Aluda - პირველი ქართული AI პლატფორმა",
    description: "უფასო ქართული AI ჩათ-ასისტენტი ყველა ქართველი მომხმარებლისთვის. უსაფრთხო და მარტივი გამოყენების AI ასისტენტი.",
    type: "website",
    locale: "ka_GE",
    siteName: "Aluda",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aluda - პირველი ქართული AI პლატფორმა",
    description: "უფასო ქართული AI ჩათ-ასისტენტი ყველა ქართველი მომხმარებლისთვის.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://aluda.ge",
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
        <GoogleTagManager />
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MS32GDR6"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Providers>
          {children}
        </Providers>
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
