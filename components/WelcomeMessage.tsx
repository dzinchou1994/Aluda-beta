'use client';

import { Brain } from 'lucide-react';
import Suggestions from './Suggestions';

interface WelcomeMessageProps {
  onPickSuggestion: (suggestion: string) => void;
}

export default function WelcomeMessage({ onPickSuggestion }: WelcomeMessageProps) {
  return (
    <div className="flex flex-col items-center text-center animate-fade-in md:justify-center md:h-full mt-6 pt-4 md:pt-0">
      <div className="w-16 h-16 md:w-20 md:h-20 logo-gradient rounded-full flex items-center justify-center mb-8 md:mb-6 animate-bounce">
        <Brain className="h-8 w-8 md:h-10 md:w-10 text-white" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-3">
        მოგესალმებათ AludaAI
      </h3>
      <p className="text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
        დაწერეთ რაიმე და დაიწყეთ საუბარი ჩვენს AI ასისტენტთან. 
        ჩვენ ვპასუხობთ ქართულ ენაზე!
      </p>
      <Suggestions onPick={onPickSuggestion} />
    </div>
  );
}
