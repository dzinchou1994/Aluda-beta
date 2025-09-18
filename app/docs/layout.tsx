import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'დოკუმენტების გენერაცია - AludaAI | CV და Invoice',
  description: 'შექმენით პროფესიონალური CV და ინვოისები AI-ის დახმარებით. სწრაფი და მარტივი გამოყენება, მზად დოკუმენტები რამდენიმე წუთში.',
  keywords: 'AludaAI, CV, ინვოისი, დოკუმენტი, გენერაცია, AI, ქართული, პროფესიონალური',
  openGraph: {
    title: 'დოკუმენტების გენერაცია - AludaAI',
    description: 'შექმენით პროფესიონალური CV და ინვოისები AI-ის დახმარებით.',
    type: 'website',
    locale: 'ka_GE',
    siteName: 'AludaAI',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://aluda.ge/docs',
  },
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
