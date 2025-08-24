'use client';

import { Brain } from 'lucide-react';

export default function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center text-center animate-fade-in md:justify-center md:h-full mt-6 pt-4 md:pt-0">
      <div className="w-16 h-16 md:w-20 md:h-20 logo-gradient rounded-full flex items-center justify-center mb-8 md:mb-6 animate-[bounce_2.5s_ease-in-out_infinite] motion-reduce:animate-none">
        <Brain className="h-8 w-8 md:h-10 md:w-10 text-white" />
      </div>
      <p className="text-lg md:text-xl font-medium text-gray-800 dark:text-white">
        რას ფიქრობ დღეს?
      </p>
      <p className="mt-2 text-xs md:text-sm text-gray-500 dark:text-gray-400">
        დაიწყო წერით ქვემოთ
      </p>
    </div>
  );
}
