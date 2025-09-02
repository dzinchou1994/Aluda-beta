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

  // Preprocess content to enforce formatting rules:
  // - Ensure '---' becomes a dedicated separator line
  const preprocessContent = (raw: string) => {
    if (!raw) return '';
    let text = raw;
    // Make sure horizontal rules are on their own lines
    text = text.replace(/---/g, '\n---\n');

    // Ensure inline markdown headings like "###1." or "## Title" start on a new line
    // Many providers emit headings mid-sentence without a newline. Move them to a new line
    // so our heading renderer can pick them up.
    text = text.replace(/\s+(#{2,6})(?=\S)/g, '\n$1 ');

    // Normalize accidental heading markers like "###1." → "1." so they don't appear as stray symbols
    // Pattern: optional spaces + 2-6 hashes + optional spaces + number + dot + space
    text = text.replace(/(^|\n)\s*#{2,6}\s*(\d{1,3})\.(?=\s)/g, (_, brk: string, num: string) => `${brk}${num}.`);

    // Split lines and apply inline list heuristics per line
    const lines = text.split('\n');
    const processedLines = lines.map((line) => {
      let current = line;

      // Heuristic for inline numbered lists: require at least two occurrences of "N. "
      // This avoids false positives like years ("2024.") or decimals ("3.14")
      const numberedPattern = /(^|\s)(\d{1,2})\.\s+/g; // 1-2 digits followed by ". "
      const countMatches = (s: string, re: RegExp) => {
        let count = 0;
        s.replace(re, () => { count++; return ''; });
        return count;
      };
      if (countMatches(current, numberedPattern) >= 2) {
        current = current.replace(numberedPattern, (_m: string, _sep: string, num: string, offset: number) => {
          const atStart = offset === 0;
          const prefix = atStart ? '' : '\n';
          return `${prefix}${num}. `;
        });
      }

      // Heuristic for inline bullets "- " or "* ": require at least two occurrences on the same line
      const bulletPattern = /(^|\s)([-*])\s+/g;
      if (countMatches(current, bulletPattern) >= 2) {
        current = current.replace(bulletPattern, (_m: string, _sep: string, bullet: string, offset: number) => {
          const atStart = offset === 0;
          const prefix = atStart ? '' : '\n';
          return `${prefix}${bullet} `;
        });
      }

      return current;
    });

    text = processedLines.join('\n');
    return text;
  };

  // Helper function to render assistant content with markdown-like formatting
  const renderAssistantContent = (content: string) => {
    if (!content) return null;
    const preprocessed = preprocessContent(content);
    
    // Split content into lines and process each line
    const lines = preprocessed.split('\n');
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Horizontal rule
      if (/^\s*-{3,}\s*$/.test(line)) {
        nodes.push(<hr key={`hr-${i}`} className="my-3 border-gray-300 dark:border-gray-700" />);
        continue;
      }

      // Check if line is a heading (starts with #)
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        const Tag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
        nodes.push(
          <Tag 
            key={`h-${i}`} 
            className={`font-bold mb-2 ${level === 1 ? 'text-lg' : level === 2 ? 'text-base' : 'text-sm'}`}
          >
            {text}
          </Tag>
        );
        continue;
      }
      
      // Special case: treat a leading "• " line as a header when followed by list items
      const isBulletHeader = /^•\s?/.test(line) && (i + 1) < lines.length && (
        /^[-*]\s/.test(lines[i + 1]) || /^•\s?/.test(lines[i + 1]) || /^\d+\.\s/.test(lines[i + 1])
      );
      if (isBulletHeader) {
        const headerText = line.replace(/^•\s?/, '');
        nodes.push(
          <div key={`bh-${i}`} className="font-bold mb-2 text-base">
            {renderMarkdownText(headerText)}
          </div>
        );
        continue;
      }

      // Detect bullet lines, including Unicode bullet "•"
      const isBullet = /^[-*]\s/.test(line) || /^•\s?/.test(line);
      if (isBullet) {
        const titleText = line.replace(/^[-*]\s/, '').replace(/^•\s?/, '');
        // Collect continuation lines that belong to this bullet item as description
        const descParts: string[] = [];
        let j = i + 1;
        while (j < lines.length) {
          const next = lines[j];
          if (!next.trim()) break;
          if (/^[-*]\s/.test(next) || /^•\s?/.test(next) || /^\d+\.\s/.test(next) || next.startsWith('#') || /^\s*-{3,}\s*$/.test(next)) {
            break;
          }
        
          descParts.push(next);
          j++;
        }
        nodes.push(
          <div key={`li-${i}`} className="flex items-start mb-2">
            <span className="mr-2 text-gray-500">•</span>
            <div>
              <div>{renderMarkdownText(titleText)}</div>
              {descParts.length > 0 && (
                <div className="text-[0.95em] text-gray-700 dark:text-gray-300 mt-1">
                  {renderMarkdownText(descParts.join(' '))}
                </div>
              )}
            </div>
          </div>
        );
        i = j - 1; // Skip consumed lines
        continue;
      }
      
      // Check if line is a numbered list item
      if (/^\d+\.\s/.test(line)) {
        nodes.push(
          <div key={`num-${i}`} className="flex items-start mb-1">
            <span className="mr-2 text-gray-500 text-sm">
              {line.match(/^\d+/)?.[0]}.
            </span>
            <span>{renderMarkdownText(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
        continue;
      }
      
      // Regular paragraph
      if (line.trim()) {
        nodes.push(<p key={`p-${i}`} className="mb-2">{renderMarkdownText(line)}</p>);
        continue;
      }
      
      // Empty line (spacing)
      nodes.push(<div key={`sp-${i}`} className="h-2" />);
    }
    return nodes;
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
          <div className="px-4 py-3 inline-block w-auto max-w-[85%] sm:max-w-[70ch] shadow-sm transition-all duration-200 hover:shadow-md chat-bubble chat-bubble-user">
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
          // AI message - FIXED: show content directly for old messages, use typing effect only for new ones
          <div className="w-full text-gray-900 dark:text-white text-sm leading-relaxed whitespace-normal break-words max-w-[92%] sm:max-w-[70ch]">
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
