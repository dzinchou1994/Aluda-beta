import { useState, useCallback, useEffect } from 'react';

interface UseTypingEffectProps {
  text: string;
  speed?: number; // milliseconds per character (legacy)
  duration?: number; // total duration in milliseconds (new approach)
  onComplete?: () => void;
}

export function useTypingEffect({ text, speed, duration, onComplete }: UseTypingEffectProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const startTyping = useCallback(async () => {
    if (!text || isTyping) return;
    
    setIsTyping(true);
    setDisplayedText('');
    
    // Calculate delay per character based on total duration
    let delayPerChar: number;
    if (duration && duration > 0) {
      // Use total duration approach - divide total time by number of characters
      delayPerChar = Math.max(10, duration / text.length); // Minimum 10ms per character
    } else {
      // Fallback to legacy speed approach
      delayPerChar = speed || 50;
    }
    
    for (let i = 1; i <= text.length; i++) {
      const partialText = text.slice(0, i);
      setDisplayedText(partialText);
      
      if (i < text.length) {
        await new Promise(resolve => setTimeout(resolve, delayPerChar));
      }
    }
    
    setIsTyping(false);
    onComplete?.();
  }, [text, speed, duration, isTyping, onComplete]);

  // Reset when text changes (for streaming updates)
  useEffect(() => {
    if (text && !isTyping) {
      setDisplayedText(text);
    }
  }, [text, isTyping]);

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
