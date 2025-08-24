'use client';

import { Brain } from 'lucide-react';

export default function WelcomeMessage() {
  return (
    <div className="relative flex flex-col items-center text-center animate-fade-in md:justify-center md:h-full mt-6 pt-4 md:pt-0">
      {/* Soft radial glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 top-1/3 md:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full blur-3xl bg-gradient-radial from-blue-400/20 via-purple-400/10 to-transparent dark:from-blue-500/15 dark:via-purple-500/10"
      />
      {/* Gradient ring + logo */}
      <div className="p-[2px] rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 shadow-glow">
        <div className="w-16 h-16 md:w-20 md:h-20 logo-gradient rounded-full flex items-center justify-center mb-8 md:mb-6 animate-float">
          <Brain className="h-8 w-8 md:h-10 md:w-10 text-white drop-shadow-sm" />
        </div>
      </div>
      <p className="text-lg md:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-700 dark:from-white dark:to-gray-200">
        რას ფიქრობს დღეს?
      </p>
      <p className="mt-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
        დაიწყო წერით ქვემოთ
      </p>
    </div>
  );
}
