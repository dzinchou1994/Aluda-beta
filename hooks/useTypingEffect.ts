import { useState, useCallback } from 'react';

interface UseTypingEffectProps {
  text: string;
  speed?: number; // milliseconds per character
  onComplete?: () => void;
}

export function useTypingEffect({ text, speed = 50, onComplete }: UseTypingEffectProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const startTyping = useCallback(async () => {
    if (!text || isTyping) return;
    
    setIsTyping(true);
    setDisplayedText('');
    
    for (let i = 1; i <= text.length; i++) {
      const partialText = text.slice(0, i);
      setDisplayedText(partialText);
      
      if (i < text.length) {
        await new Promise(resolve => setTimeout(resolve, speed));
      }
    }
    
    setIsTyping(false);
    onComplete?.();
  }, [text, speed, isTyping, onComplete]);

  const reset = useCallback(() => {
    setDisplayedText('');
    setIsTyping(false);
  }, []);

  return {
    displayedText,
    isTyping,
    startTyping,
    reset,
    isComplete: displayedText === text && !isTyping
  };
}
