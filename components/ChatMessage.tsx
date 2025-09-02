'use client';

import { Message } from '@/hooks/useChats';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';

// Simple check: contains typical HTML tags
function looksLikeHtml(text: string): boolean {
  return /<\s*(p|br|h[1-6]|ul|ol|li|strong|em|b|i|a)[^>]*>/i.test(text);
}

// Render markdown headings as regular paragraphs (Flowise-like visual weight)
const mdComponents = {
  a: (props: any) => <a {...props} target="_blank" rel="noopener noreferrer" />,
  h1: ({ children }: any) => <p>{children}</p>,
  h2: ({ children }: any) => <p>{children}</p>,
  h3: ({ children }: any) => <p>{children}</p>,
  h4: ({ children }: any) => <p>{children}</p>,
  h5: ({ children }: any) => <p>{children}</p>,
  h6: ({ children }: any) => <p>{children}</p>,
};

interface ChatMessageProps {
  message: Message;
  index: number;
  shouldAnimate: boolean;
}

// Insert newlines before inline numbered items (e.g., "1. ... 2. ...") to mimic Flowise lists
function preprocessForMarkdown(raw: string | undefined | null): string {
  if (!raw) return '';
  let text = String(raw).replace(/\r\n/g, '\n');
  // Normalize invisible spaces and fullwidth hash
  text = text.replace(/\u00A0/g, ' '); // NBSP to space
  text = text.replace(/[\u200B\u200C\u200D\uFEFF]/g, ''); // zero-width chars
  text = text.replace(/\uFF03/g, '#'); // fullwidth '#'
  // Ensure inline headings like #, ##, ### start on a new line if they appear mid-sentence
  text = text.replace(/\s+(#{1,6})(?=\S)/g, '\n$1 ');
  // If a heading is preceded by quotes, normalize: " #### Title" -> "\n#### Title"
  text = text.replace(/(^|\n)\s*["'“”]\s*(#{1,6})\s+/g, (_m, brk: string, hashes: string) => `${brk}${hashes} `);
  // Strip an extra literal "# " after heading markers, e.g., "## # Title" -> "## Title"
  text = text.replace(/^(#{1,6})\s*#\s+/gm, '$1 ');
  // Normalize heading lines: collapse to a single space after hashes and ensure within 0-3 leading spaces
  text = text.replace(/^[ \t]{0,3}(#{1,6})[ \t]*/gm, (_m, hashes: string) => `${hashes} `);
  // Split inline numbers into new lines when multiple in a paragraph
  const splitInlineNumbers = (paragraph: string) => {
    const count = (paragraph.match(/(^|\s)\d{1,3}\.\s/g) || []).length;
    if (count >= 2) {
      let out = paragraph.replace(/([^\n])\s(\d{1,3})\.\s/g, (_m, prev: string, num: string) => `${prev}\n${num}. `);
      out = out.replace(/(^|\n)\s+(\d{1,3})\.\s/g, (_m, brk: string, num: string) => `${brk}${num}. `);
      return out;
    }
    return paragraph;
  };
  // Preserve blank lines as paragraph breaks; also split inline numbers within each paragraph
  const paragraphs = text.split(/\n{2,}/);
  const processed = paragraphs.map((p) => p.split('\n').map((l) => l).join('\n')).map(splitInlineNumbers);
  return processed.join('\n\n');
}

function normalizeHeadingHashesInHtml(html: string): string {
  // Remove a single literal "# " immediately after an opening heading tag
  return html.replace(/<(h[1-6])(\b[^>]*)>\s*#\s+/gi, '<$1$2>');
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

  // Render assistant content using Markdown to mirror Flowise formatting
  const renderAssistantContent = (content: string) => {
    if (content === undefined || content === null) return null;
    // Prefer HTML if provided (Flowise can output HTML when renderHTML is true)
    if (looksLikeHtml(content)) {
      const clean = DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });
      const normalized = normalizeHeadingHashesInHtml(clean);
      return (
        <div className="flowise-html" dangerouslySetInnerHTML={{ __html: normalized }} />
      );
    }
    const pre = preprocessForMarkdown(content);
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-h1:text-[1.1rem] prose-h2:text-[1.05rem] prose-h3:text-[1rem] prose-h4:text-[0.95rem] prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]} components={mdComponents}>{pre}</ReactMarkdown>
      </div>
    );
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
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-h1:text-[1.1rem] prose-h2:text-[1.05rem] prose-h3:text-[1rem] prose-h4:text-[0.95rem] prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]} components={mdComponents}>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ) : (
          // AI message - show markdown/HTML content
          <div className="w-full text-gray-900 dark:text-white text-base leading-relaxed max-w-[92%] sm:max-w-[70ch]">
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