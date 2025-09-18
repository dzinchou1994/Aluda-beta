import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'კომპანიებისთვის - AludaAI | ბიზნეს AI ასისტენტი',
  description: 'AludaAI ბიზნესისთვის - ინტელექტუალური ჩათ-ასისტენტი, რომელიც კომპანიებს ეხმარება მომხმარებლებთან კომუნიკაციის გაუმჯობესებაში. 24/7 მხარდაჭერა, ანალიტიკა, ინტეგრაცია.',
  keywords: 'AludaAI, ბიზნესი, კომპანია, AI ასისტენტი, ჩათ-ბოტი, მომხმარებლის მომსახურება, ანალიტიკა, ინტეგრაცია',
  openGraph: {
    title: 'კომპანიებისთვის - AludaAI',
    description: 'AludaAI ბიზნესისთვის - ინტელექტუალური ჩათ-ასისტენტი, რომელიც კომპანიებს ეხმარება მომხმარებლებთან კომუნიკაციის გაუმჯობესებაში.',
    type: 'website',
    locale: 'ka_GE',
    siteName: 'AludaAI',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://aluda.ge/companies',
  },
}

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
