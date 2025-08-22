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
  // Use typing effect for AI messages
  const { displayedText, isTyping, startTyping, isComplete } = useTypingEffect({
    text: message.content || '',
    speed: 30, // 30ms per character for smooth typing
    onComplete: () => {
      // Optional: do something when typing is complete
    }
  });

  // Start typing effect when AI message appears
  useEffect(() => {
    if (message.role === 'assistant' && message.content && !isComplete) {
      startTyping();
    }
  }, [message.role, message.content, startTyping, isComplete]);

  // Helper function to render assistant content with markdown-like formatting
  const renderAssistantContent = (content: string) => {
    if (!content) return null;
    
    // Split content into lines and process each line
    const lines = content.split('\n');
    return lines.map((line, lineIndex) => {
      // Check if line is a heading (starts with #)
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        const Tag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
        
        return (
          <Tag 
            key={lineIndex} 
            className={`font-bold mb-2 ${
              level === 1 ? 'text-lg' : level === 2 ? 'text-base' : 'text-sm'
            }`}
          >
            {text}
          </Tag>
        );
      }
      
      // Check if line is a list item
      if (line.match(/^[-*]\s/)) {
        return (
          <div key={lineIndex} className="flex items-start mb-1">
            <span className="mr-2 text-gray-500">•</span>
            <span>{line.replace(/^[-*]\s/, '')}</span>
          </div>
        );
      }
      
      // Check if line is a numbered list item
      if (line.match(/^\d+\.\s/)) {
        return (
          <div key={lineIndex} className="flex items-start mb-1">
            <span className="mr-2 text-gray-500 text-sm">
              {line.match(/^\d+/)?.[0]}.
            </span>
            <span>{line.replace(/^\d+\.\s/, '')}</span>
          </div>
        );
      }
      
      // Regular paragraph
      if (line.trim()) {
        return <p key={lineIndex} className="mb-2">{line}</p>;
      }
      
      // Empty line (spacing)
      return <div key={lineIndex} className="h-2" />;
    });
  };

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
          <div className="px-4 py-3 inline-block w-auto max-w-[60ch] md:max-w-[70ch] shadow-sm transition-all duration-200 hover:shadow-md chat-bubble chat-bubble-user">
            <div className="space-y-2">
              {message.imageUrl && (
                <img src={message.imageUrl} alt="attachment" className="rounded-md border border-gray-200 dark:border-gray-700 max-w-full" />
              )}
              {message.content && (
                <p className="text-sm leading-relaxed whitespace-normal break-words">
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
          // AI message with typing effect
          <div className="w-full text-gray-900 dark:text-white text-sm leading-relaxed whitespace-normal break-words">
            {renderAssistantContent(displayedText)}
            {isTyping && (
              <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
            )}
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
