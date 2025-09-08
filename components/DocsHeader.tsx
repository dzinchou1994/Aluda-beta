'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain } from 'lucide-react';

type DocsHeaderProps = {
  backHref: string;
  backLabel?: string;
  title?: string;
  showBeta?: boolean;
};

export default function DocsHeader({ backHref, backLabel = 'Back', title, showBeta = false }: DocsHeaderProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          aria-label={backLabel}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="hidden sm:inline">{backLabel}</span>
        </button>

        {title ? (
          <div className="flex items-center gap-2" aria-label={title}>
            <div className="w-7 h-7 logo-gradient rounded-lg flex items-center justify-center mr-1">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
            {showBeta && (
              <span className="text-[10px] font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white px-1 py-0.5 rounded-full">BETA</span>
            )}
          </div>
        ) : (
          <Link href="/chat" className="flex items-center" aria-label="AludaAI">
            <div className="w-7 h-7 logo-gradient rounded-lg flex items-center justify-center mr-2">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">AludaAI</span>
              <span className="text-[10px] font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white px-1 py-0.5 rounded-full">BETA</span>
            </div>
          </Link>
        )}

        <div className="w-10" />
      </div>
    </div>
  );
}


