import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AludaAI - ქართული AI ჩათ-ასისტენტი | უფასო ხელოვნური ინტელექტი',
  description: 'AludaAI არის ქართული AI ჩათ-ასისტენტი, რომელიც ეხმარება ქართველ მომხმარებლებს ყოველდღიურ ამოცანებში. უფასო, უსაფრთხო და მარტივი გამოყენების AI ასისტენტი.',
  keywords: 'AludaAI, ხელოვნური ინტელექტი, AI, ჩათ-ბოტი, ქართული, საქართველო, უფასო, AI ასისტენტი, ქართული AI, ChatGPT ქართულად',
  openGraph: {
    title: 'AludaAI - ქართული AI ჩათ-ასისტენტი',
    description: 'უფასო ქართული AI ჩათ-ასისტენტი ყველა ქართველი მომხმარებლისთვის. უსაფრთხო და მარტივი გამოყენების AI ასისტენტი.',
    type: 'website',
    locale: 'ka_GE',
    siteName: 'AludaAI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AludaAI - ქართული AI ჩათ-ასისტენტი',
    description: 'უფასო ქართული AI ჩათ-ასისტენტი ყველა ქართველი მომხმარებლისთვის.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://aluda.app',
  },
};

export default function HomePage() {
  redirect('/chat');
}
