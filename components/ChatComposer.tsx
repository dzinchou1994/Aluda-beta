'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useChats, Message } from '@/hooks/useChats';
import { useChatsContext } from '@/context/ChatsContext';
import { useTokens } from '@/context/TokensContext';
import { useModel } from '@/context/ModelContext';
import { Session } from 'next-auth';
import WelcomeMessage from './WelcomeMessage';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChatScroll } from '@/hooks/useChatScroll';
import { useChatSubmit } from '@/hooks/useChatSubmit';
import { useMobileKeyboard } from '@/hooks/useMobileKeyboard';

interface ChatComposerProps {
  currentChatId?: string;
  session: Session | null;
  onChatCreated: (chatId: string) => void;
}

export default function ChatComposer({ currentChatId: propCurrentChatId, session, onChatCreated }: ChatComposerProps) {
  useMobileKeyboard();
  const router = useRouter();
  const { model } = useModel();
  const { usage, limits, setUsageLimits } = useTokens();
  const { 
    chats, 
    currentChatId: contextCurrentChatId, 
    setCurrentChatId, 
    createNewChat, 
    addMessageToChat, 
    updateMessageInChat,
    renameChat,
    isInitialized
  } = useChatsContext();

  // Use prop currentChatId if provided, otherwise use context
  const currentChatId = propCurrentChatId || contextCurrentChatId;

  // Local state
  const [message, setMessage] = useState('');
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [attachedPreviewUrl, setAttachedPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);

  // Use custom hooks
  const {
    messagesEndRef,
    messagesContainerRef,
    handleScroll,
    handleInputFocus,
    handleInputChange,
  } = useChatScroll({
    messagesLength: chats.find(c => c.id === currentChatId)?.messages?.length || 0,
    isLoading: false, // We'll handle this separately
  });

  const { isLoading, handleSubmit } = useChatSubmit({
    model,
    currentChatId: currentChatId || null,
    createNewChat,
    addMessageToChat,
    updateMessageInChat,
    onChatCreated,
    setCurrentChatId,
    setError,
    renameChat,
    getCurrentChatMessages: () => chats.find(c => c.id === currentChatId)?.messages || [],
  });

  // Wrapper for handleSubmit to handle local state
  const handleSubmitWrapper = (e: React.FormEvent) => {
    // Start sending without awaiting the AI response
    void handleSubmit(
      e,
      message,
      attachedImage,
      attachedPreviewUrl,
      setAttachedImage,
      setAttachedPreviewUrl,
      setMessage
    );

    // Force immediate scroll to bottom, even if user had scrolled up
    try {
      const container = messagesContainerRef.current as HTMLDivElement | null
      if (container) {
        container.dataset.userScrolled = 'false'
        container.scrollTop = container.scrollHeight
      }
    } catch {}

    // Also ensure anchor-based scroll for robustness
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest'
      });
    });
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest'
      });
    }, 100);
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitWrapper(e as any);
    }
  };

  // Handle input change with scroll management
  const handleInputChangeWrapper = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e, setMessage);
  };

  // Start new chat
  const startNewChat = () => {
    if (!isInitialized) return;
    
    console.log('ChatComposer: Starting new chat...');
    const newChatId = createNewChat();
    console.log('ChatComposer: New chat created with ID:', newChatId);
    
    setCurrentChatId(newChatId);
    onChatCreated(newChatId);
  };

  // Get current chat messages
  const currentChat = chats.find(c => c.id === currentChatId);
  const currentChatMessages = currentChat?.messages || [];
  const hasScrollableContent = currentChatMessages.length > 0;

  // Debug logging
  console.log('ChatComposer render:', {
    currentChatId,
    currentChatMessages: currentChatMessages.length,
    isLoading,
    message
  });

  // Don't render until initialized
  if (!isInitialized) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-gray-500 dark:text-gray-400" />
              <div className="absolute inset-0 bg-gray-500/20 dark:bg-gray-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium animate-fade-in-up">იტვირთება...</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 animate-fade-in-up-delay">მზად ვართ საუბრისთვის</p>
          </div>
        </div>
      </div>
    );
  }

  // On first mount, nudge scroll to bottom for mobile to avoid first-focus issue
  useEffect(() => {
    try {
      const container = messagesContainerRef.current as HTMLDivElement | null
      if (!container) return
      const nudge = () => {
        container.dataset.userScrolled = 'false'
        container.scrollTop = container.scrollHeight
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' })
      }
      if (window.innerWidth <= 768) {
        setTimeout(nudge, 50)
        setTimeout(nudge, 150)
        requestAnimationFrame(nudge)
      }
    } catch {}
  }, [])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-chat-bg transition-colors duration-200 min-w-0">
      {/* Messages Area - Scrollable content with dynamic spacing for fixed elements */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 min-h-0 px-3 md:px-4 pt-2 md:pt-3 pb-0 md:pb-4 space-y-3 md:space-y-4 bg-white dark:bg-chat-bg messages-container-spacing overflow-y-auto overscroll-contain`}
        style={{
          WebkitOverflowScrolling: 'touch',
          // Always allow scrolling for input visibility
        }}
        onScroll={handleScroll}
      >
        {/* Welcome Message */}
        {currentChatMessages.length === 0 ? (
          <div className="pt-8 pb-4">
            <WelcomeMessage />
          </div>
        ) : (
          <div className="space-y-4">
            {currentChatMessages.map((msg, index) => {
              // Check if this is a truly new message or just loaded from storage
              // Only animate messages that are being created right now, not old ones from storage
              const isLastMessage = index === currentChatMessages.length - 1;
              const isCurrentMessageBeingTyped = isLoading && isLastMessage && msg.role === 'assistant';
              const shouldAnimate = isCurrentMessageBeingTyped;

              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  index={index}
                  shouldAnimate={shouldAnimate}
                />
              );
            })}
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3 animate-fade-in-up">
            <div className="max-w-[70%]">
              <div className="text-gray-900 dark:text-white">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">Aluda ფიქრობს...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start space-x-3 animate-fade-in-up">
            <div className="max-w-[70%]">
              <div className="text-red-700 dark:text-red-400">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-2 md:h-0" />
      </div>

      {/* Chat Input */}
      <ChatInput
        message={message}
        setMessage={setMessage}
        attachedImage={attachedImage}
        setAttachedImage={setAttachedImage}
        attachedPreviewUrl={attachedPreviewUrl}
        setAttachedPreviewUrl={setAttachedPreviewUrl}
        isLoading={isLoading}
        onSubmit={handleSubmitWrapper}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onInputChange={handleInputChangeWrapper}
      />
    </div>
  );
}
