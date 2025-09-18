import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'პაკეტები - AludaAI | უფასო და პრემიუმ გეგმები',
  description: 'აირჩიეთ AludaAI-ის უფასო ან პრემიუმ გეგმა. უფასო გეგმა: 7,500 ტოკენი დღეში. პრემიუმი: 25,000 ტოკენი დღეში + სურათების გენერაცია.',
  keywords: 'AludaAI, პაკეტები, უფასო, პრემიუმ, ტოკენები, AI, ქართული, გადახდა',
  openGraph: {
    title: 'პაკეტები - AludaAI',
    description: 'აირჩიეთ AludaAI-ის უფასო ან პრემიუმ გეგმა. უფასო გეგმა: 7,500 ტოკენი დღეში.',
    type: 'website',
    locale: 'ka_GE',
    siteName: 'AludaAI',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://aluda.ge/buy',
  },
}

export default function BuyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
