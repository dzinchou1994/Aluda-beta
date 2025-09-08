'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';


import { Brain } from 'lucide-react';

export default function DocumentsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Sticky Header with Back and Logo */}
      <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </button>

          <Link href="/chat" className="flex items-center" aria-label="AludaAI">
            <div className="w-7 h-7 logo-gradient rounded-lg flex items-center justify-center mr-2">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">AludaAI</span>
          </Link>

          {/* Spacer to balance flex layout */}
          <div className="w-10" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            დოკუმენტის გენერაცია
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            შექმენით პროფესიონალური CV და ინვოისები AI-ის დახმარებით
          </p>
        </div>

        {/* Document Type Selection */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-8">
            {/* CV Generator Box */}
            <div 
              onClick={() => router.push('/docs/cv')}
              className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400"
            >
              <div className="text-center">
                <div className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-3 md:mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2 md:mb-4">
                  შექმენი CV
                </h3>
                <p className="hidden md:block text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  შექმენით პროფესიონალური CV სხვადასხვა ტემპლეიტებით. 
                  შეავსეთ თქვენი ინფორმაცია და მიიღეთ მზად CV რამდენიმე წუთში.
                </p>
                <div className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors text-sm md:text-base">
                  <span>დაიწყეთ</span>
                  <svg className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Invoice Generator Box */}
            <div 
              onClick={() => router.push('/docs/invoice')}
              className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-400"
            >
              <div className="text-center">
                <div className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-3 md:mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2 md:mb-4">
                  შექმენი Invoice
                </h3>
                <p className="hidden md:block text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  შექმენით პროფესიონალური ინვოისები თქვენი ბიზნესისთვის. 
                  დაამატეთ ნივთები, გამოთვალეთ ჯამი და გამოაქვეყნეთ PDF-ად.
                </p>
                <div className="inline-flex items-center text-green-600 dark:text-green-400 font-semibold group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors text-sm md:text-base">
                  <span>დაიწყეთ</span>
                  <svg className="w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Footer Text */}
          <div className="mt-16 md:hidden text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              AI-ის დახმარებით შექმენით პროფესიონალური დოკუმენტები. 
              <br />
              სწრაფი და მარტივი გამოყენება, მზად დოკუმენტები რამდენიმე წუთში.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
