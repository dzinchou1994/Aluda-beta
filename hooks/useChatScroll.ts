import { useRef, useEffect } from 'react';

interface UseChatScrollProps {
  messagesLength: number;
  isLoading: boolean;
}

export function useChatScroll({ messagesLength, isLoading }: UseChatScrollProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Throttle scroll adjustments on mobile to avoid flicker while typing (iOS)
  const lastAdjustRef = useRef<number>(0);

  // Smart scroll behavior when messages change
  useEffect(() => {
    if (!messagesEndRef.current || !messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const userHasScrolled = container.dataset.userScrolled === 'true';
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
    
    // Only auto-scroll if user is at bottom AND hasn't manually scrolled up
    if (isAtBottom && !userHasScrolled) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      });
    }
  }, [messagesLength, isLoading]);

  // Handle scroll events for smooth mobile experience
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (window.innerWidth <= 768) {
      const container = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Store scroll position to prevent unwanted auto-scrolling
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 10;
      
      // If user scrolls up, don't auto-scroll them back down
      if (!isAtBottom) {
        // User has manually scrolled up, respect their position
        container.dataset.userScrolled = 'true';
      } else {
        // User is at bottom, allow auto-scrolling
        container.dataset.userScrolled = 'false';
      }
    }
  };

  // Handle mobile input focus to maintain scroll position
  const handleInputFocus = () => {
    if (window.innerWidth <= 768) {
      // Pin to bottom on focus
      const container = messagesContainerRef.current
      if (container) container.dataset.userScrolled = 'false'
      setTimeout(() => {
        if (messagesEndRef.current && messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'auto', 
            block: 'end',
            inline: 'nearest'
          })
        }
      }, 20)
    }
  };

  // Handle mobile input change to maintain scroll position
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>, setMessage: (value: string) => void) => {
    setMessage(e.target.value)
    
    // On mobile, always pin to bottom while typing
    if (window.innerWidth <= 768 && messagesContainerRef.current) {
      const now = Date.now()
      // Throttle to at most ~5 times per second
      if (now - lastAdjustRef.current >= 200) {
        lastAdjustRef.current = now
        const container = messagesContainerRef.current
        container.dataset.userScrolled = 'false'
        requestAnimationFrame(() => {
          try {
            container.scrollTop = container.scrollHeight
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ 
                behavior: 'auto', 
                block: 'end',
                inline: 'nearest'
              })
            }
          } catch {}
        })
      }
    }
  };

  return {
    messagesEndRef,
    messagesContainerRef,
    handleScroll,
    handleInputFocus,
    handleInputChange,
  };
}
