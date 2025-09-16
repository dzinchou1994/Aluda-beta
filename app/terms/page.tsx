import Link from 'next/link';
import { ArrowLeft, Shield, Users, Brain, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'წესები და პირობები - AludaAI | მომხმარებლის უფლებები და ვალდებულებები',
  description: 'AludaAI-ის წესები და პირობები. მომხმარებლის უფლებები, ვალდებულებები, მონაცემთა დაცვა და სერვისის გამოყენების წესები.',
  keywords: 'AludaAI, წესები, პირობები, მომხმარებელი, უფლებები, ვალდებულებები, მონაცემთა დაცვა, პირადი მონაცემები, საქართველო',
  openGraph: {
    title: 'წესები და პირობები - AludaAI',
    description: 'AludaAI-ის წესები და პირობები. მომხმარებლის უფლებები და ვალდებულებები.',
    type: 'website',
    locale: 'ka_GE',
    siteName: 'AludaAI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'წესები და პირობები - AludaAI',
    description: 'AludaAI-ის წესები და პირობები. მომხმარებლის უფლებები და ვალდებულებები.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://aluda.app/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link 
                href="/chat"
                className="inline-flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                უკან დაბრუნება
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AludaAI
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            წესები და პირობები
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            AludaAI პლატფორმის გამოყენებისას გთხოვთ დაიცვათ შემდეგი წესები და პირობები
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8">
          {/* General Terms */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                ზოგადი პირობები
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                AludaAI არის ხელოვნური ინტელექტის პლატფორმა, რომელიც გთავაზობთ AI-ასისტენტთან ურთიერთობის შესაძლებლობას. 
                პლატფორმის გამოყენებით თქვენ ეთანხმებით ამ წესების დაცვას.
              </p>
              <p>
                ჩვენ ვცდილობთ უზრუნველვყოთ უმაღლესი ხარისხის სერვისი, მაგრამ არ ვიღებთ პასუხისმგებლობას 
                AI-ის პასუხების სიზუსტეზე ან სანდოობაზე.
              </p>
            </div>
          </section>

          {/* Acceptable Use */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-4">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                მისაღები გამოყენება
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>პლატფორმა შეგიძლიათ გამოიყენოთ:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>საგანმანათლებლო მიზნებისთვის</li>
                <li>პროფესიული განვითარებისთვის</li>
                <li>ცოდნის მიღებისთვის</li>
                <li>კრეატიული პროექტებისთვის</li>
                <li>პრობლემების გადაწყვეტისთვის</li>
              </ul>
            </div>
          </section>

          {/* Prohibited Use */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mr-4">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                აკრძალული გამოყენება
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>აკრძალულია:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>არაკანონიერი აქტივობებისთვის</li>
                <li>ზიანის მიყენების მიზნით</li>
                <li>სხვა მომხმარებლების პრივატულობის დარღვევისთვის</li>
                <li>სპამის ან ბოტების გამოყენებისთვის</li>
                <li>პლატფორმის უსაფრთხოების დაზიანებისთვის</li>
              </ul>
            </div>
          </section>

          {/* Privacy & Data */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-4">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                კონფიდენციალურობა და მონაცემები
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                ჩვენ ვცდილობთ ვიყოთ გამჭვირვალე თქვენი მონაცემების გამოყენების შესახებ. 
                ჩვენი პრივატულობის პოლიტიკა დეტალურად აღწერს, თუ როგორ ვიყენებთ და ვიცავთ თქვენს ინფორმაციას.
              </p>
              <p>
                AI-სთან ურთიერთობისას გთხოვთ არ გაუზიაროთ მგრძნობიარე პირადი ინფორმაცია.
              </p>
            </div>
          </section>

          {/* AI Limitations */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mr-4">
                <Brain className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                AI-ის შეზღუდვები
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>გთხოვთ გაითვალისწინოთ:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>AI-ის პასუხები შეიძლება არ იყოს 100% ზუსტი</li>
                <li>ყოველთვის შეამოწმეთ მნიშვნელოვანი ინფორმაცია</li>
                <li>AI არ არის სამედიცინო ან იურიდიული რჩევების წყარო</li>
                <li>გამოიყენეთ AI როგორც დამხმარე ინსტრუმენტი, არა როგორც ერთადერთი წყარო</li>
              </ul>
            </div>
          </section>

          {/* Updates & Changes */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mr-4">
                <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                განახლებები და ცვლილებები
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>
                ჩვენ ვიტოვებთ უფლებას შევცვალოთ ეს წესები ნებისმიერ დროს. 
                ცვლილებების შესახებ შეგატყობინებთ პლატფორმაზე ან ელფოსტით.
              </p>
              <p>
                განახლებული წესების გამოყენებით თქვენ ეთანხმებით ახალ პირობებს.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              კითხვები გაქვთ?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              თუ გაქვთ კითხვები ამ წესების შესახებ, დაგვიკავშირდით
            </p>
            <Link 
              href="/chat"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              დაბრუნება ჩატში
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
