'use client';

import { Message } from '@/hooks/useChats';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import { useEffect } from 'react';

interface ChatMessageProps {
  message: Message;
  index: number;
  shouldAnimate: boolean;
}

export default function ChatMessage({ message, index, shouldAnimate }: ChatMessageProps) {
  // FIXED: Only use typing effect for truly new AI messages
  // Old messages should show content directly without typing effect
  // shouldAnimate should only be true for messages that are actually being created right now
  const shouldUseTypingEffect = message.role === 'assistant' && shouldAnimate && message.content;
  
  const { displayedText, isTyping, startTyping, isComplete } = useTypingEffect({
    text: message.content || '',
    duration: 750, // 750ms total duration for typing effect (2x slower than before)
    onComplete: () => {
      // Optional: do something when typing is complete
    }
  });

  // Start typing effect only for new AI messages
  useEffect(() => {
    if (shouldUseTypingEffect && !isComplete) {
      startTyping();
    }
  }, [shouldUseTypingEffect, startTyping, isComplete]);

  // No preprocessing: show text exactly as received
  const preprocessContent = (raw: string) => raw || '';

  // Helper function to render assistant content as plain text (no formatting)
  const renderAssistantContent = (content: string) => {
    if (content === undefined || content === null) return null;
    return <pre className="whitespace-pre-wrap break-words mb-2">{content}</pre>;
  };

  // No markdown helpers – content is rendered as-is

  return (
    <div
      className={`flex flex-nowrap items-start space-x-3 ${shouldAnimate ? 'animate-fade-in-up' : ''} ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
      style={shouldAnimate ? { animationDelay: `${index * 100}ms` } : undefined}
    >
      {/* Message Content - User messages with bubbles, AI messages as simple text */}
      <div className={`min-w-0 max-w-full md:max-w-[70%] ${shouldAnimate ? 'animate-fade-in-left' : ''} flex flex-col ${
        message.role === 'user' ? 'items-end order-first' : 'items-start order-last'
      }`}>
        {message.role === 'user' ? (
          // User message with bubble
          <div className="px-4 py-3 inline-block w-auto max-w-[85%] sm:max-w-[70ch] shadow-sm transition-all duration-200 hover:shadow-md chat-bubble chat-bubble-user">
            <div className="space-y-2">
              {message.imageUrl && (
                <img src={message.imageUrl} alt="attachment" className="rounded-md border border-gray-200 dark:border-gray-700 max-w-full" />
              )}
              {message.content && (
                <p className="text-base leading-relaxed whitespace-normal break-words">
                  {/* linkify user content */}
                  {(() => {
                    const urlSplitRegex = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/gi
                    return message.content.split(urlSplitRegex).map((part, i) => {
                      const isUrl = /^(https?:\/\/|www\.)/i.test(part)
                      if (isUrl) {
                        const href = part.startsWith('http') ? part : `https://${part}`
                        return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-200 underline break-all">{part}</a>
                      }
                      return <span key={i}>{part}</span>
                    })
                  })()}
                </p>
              )}
            </div>
          </div>
        ) : (
          // AI message - FIXED: show content directly for old messages, use typing effect only for new ones
          <div className="w-full text-gray-900 dark:text-white text-base leading-relaxed whitespace-normal break-words max-w-[92%] sm:max-w-[70ch]">
            {shouldUseTypingEffect && isTyping ? renderAssistantContent(displayedText) : renderAssistantContent(message.content)}
          </div>
        )}
        {/* Timestamp - Hidden for cleaner interface */}
        {/* <div className={`${message.role === 'user' ? 'text-right' : 'text-left'} mt-1`}> 
          <time
            dateTime={(message as any).timestamp}
            title={formatFullDateTime((message as any).timestamp)}
            className="text-[11px] text-gray-400 dark:text-gray-500"
          >
            {formatShortTime((message as any).timestamp)}
          </time>
        </div> */}
      </div>
    </div>
  );
}
