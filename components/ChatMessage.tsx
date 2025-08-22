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
  // Only use typing effect for new AI messages that are currently being typed
  // Old messages should show content directly without typing effect
  const isNewMessage = message.content === '' || shouldAnimate;
  const shouldUseTypingEffect = message.role === 'assistant' && isNewMessage && message.content;
  
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
            <span>{renderMarkdownText(line.replace(/^[-*]\s/, ''))}</span>
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
            <span>{renderMarkdownText(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
      }
      
      // Regular paragraph
      if (line.trim()) {
        return <p key={lineIndex} className="mb-2">{renderMarkdownText(line)}</p>;
      }
      
      // Empty line (spacing)
      return <div key={lineIndex} className="h-2" />;
    });
  };

  // Helper function to render markdown text with bold formatting and links
  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    
    // First, handle links [text](url)
    let processedText = text;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: Array<{ text: string; url: string; index: number }> = [];
    let linkMatch;
    let linkIndex = 0;
    
    // Find all links and store them
    while ((linkMatch = linkRegex.exec(text)) !== null) {
      links.push({
        text: linkMatch[1],
        url: linkMatch[2],
        index: linkMatch.index
      });
    }
    
    // If no links, just handle bold formatting
    if (links.length === 0) {
      return renderBoldText(text);
    }
    
    // Process text with links
    let result: React.ReactNode[] = [];
    let lastIndex = 0;
    
    links.forEach((link, i) => {
      // Add text before link
      if (link.index > lastIndex) {
        const beforeText = text.slice(lastIndex, link.index);
        result.push(renderBoldText(beforeText));
      }
      
              // Add link
        result.push(
          <a 
            key={`link-${i}`} 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            {renderBoldText(link.text)}
          </a>
        );
      
      lastIndex = link.index + link.text.length + link.url.length + 4; // +4 for []( )
    });
    
    // Add remaining text after last link
    if (lastIndex < text.length) {
      const afterText = text.slice(lastIndex);
      result.push(renderBoldText(afterText));
    }
    
    return result;
  };

  // Helper function to render bold text only
  const renderBoldText = (text: string) => {
    if (!text) return null;
    
    // Split text by bold markers (**text**)
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    return parts.map((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Bold text - remove ** markers and make bold
        const boldText = part.slice(2, -2);
        return <strong key={partIndex} className="font-bold">{boldText}</strong>;
      } else {
        // Regular text
        return <span key={partIndex}>{part}</span>;
      }
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
          // AI message - show content directly for old messages, use typing effect for new ones
          <div className="w-full text-gray-900 dark:text-white text-sm leading-relaxed whitespace-normal break-words">
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
