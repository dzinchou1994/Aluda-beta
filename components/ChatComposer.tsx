'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, User, Bot, MessageSquare, Plus, Image as ImageIcon, X } from 'lucide-react';
import { useChats, Message } from '@/hooks/useChats';
import { useChatsContext } from '@/context/ChatsContext';
import { useTokens } from '@/context/TokensContext';
import ModelSwitcher from '@/components/ModelSwitcher';
import { useModel } from '@/context/ModelContext';
import { Session } from 'next-auth';

function Suggestions({ onPick }: { onPick: (s: string) => void }) {
  const [topics, setTopics] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const res = await fetch(`/api/suggestions?ts=${Date.now()}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({ suggestions: [] }))
        const list: string[] = Array.isArray(data?.suggestions) ? data.suggestions : []
        if (isMounted) setTopics((list || []).slice(0, 4))
      } catch {
        if (isMounted) setTopics([])
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [])

  const fallback = ['მირჩიე ფილმი საღამოსთვის', 'რა ხდება საქართველოში?', 'მასწავლე საინტერესო ფაქტი', 'მირჩიე ადგილი ტურიზმისთვის']
  const items = (topics && topics.length > 0 ? topics : fallback).slice(0, 4)

  return (
    <div className="mt-6 flex flex-wrap gap-3 justify-center">
      {items.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          onClick={() => onPick(suggestion)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 shadow-sm hover:shadow-md animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
          disabled={loading}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}

interface ChatComposerProps {
  currentChatId?: string
  onChatCreated: (chatId: string) => void
  session: Session | null
}

export default function ChatComposer({ currentChatId, onChatCreated, session }: ChatComposerProps) {
  const router = useRouter()
  const { 
    chats, 
    currentChatId: hookCurrentChatId, 
    currentChatMessages, 
    createNewChat, 
    addMessageToChat,
    setCurrentChatId,
    renameChat,
    isInitialized
  } = useChatsContext()
  const { setUsageLimits } = useTokens()
  
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { model, setModel } = useModel()
  
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const renderedMessageIdsRef = useRef<Set<string>>(new Set())
  const [attachedImage, setAttachedImage] = useState<File | null>(null)
  const [attachedPreviewUrl, setAttachedPreviewUrl] = useState<string | null>(null)
  
  // Render assistant content with special formatting; support markdown links [text](url)
  function renderAssistantContent(content: string) {
    // Plain URL linkifier
    const renderPlainLinks = (text: string) => {
      const urlSplitRegex = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/gi
      return text.split(urlSplitRegex).map((part, i) => {
        const isUrl = /^(https?:\/\/|www\.)/i.test(part)
        if (isUrl) {
          const href = part.startsWith('http') ? part : `https://${part}`
          return (
            <a key={`url-${i}`} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
              {part}
            </a>
          )
        }
        return <span key={`txt-${i}`}>{part}</span>
      })
    }

    // Markdown [text](url) + fallback to plain URLs
    const renderInline = (text: string) => {
      const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
      const elements: any[] = []
      let lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = mdRegex.exec(text)) !== null) {
        const [full, label, href] = match
        const before = text.slice(lastIndex, match.index)
        if (before) elements.push(<span key={`b-${lastIndex}`}>{renderPlainLinks(before)}</span>)
        elements.push(
          <a key={`a-${match.index}`} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
            {label}
          </a>
        )
        lastIndex = match.index + full.length
      }
      const tail = text.slice(lastIndex)
      if (tail) elements.push(<span key={`t-${lastIndex}`}>{renderPlainLinks(tail)}</span>)
      return elements
    }

    const lines = content.split(/\r?\n/)
    return (
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const mdHeading = line.match(/^\s*#{3,}\s*(.+?)\s*[:：]?\s*$/)
          if (mdHeading) {
            const title = mdHeading[1]
            return (
              <div key={idx}>
                <div className="font-bold text-lg leading-snug">{title}</div>
              </div>
            )
          }

          // Numbered list where item is a markdown link: "1. [Label](url)"
          const mdListLink = line.match(/^\s*(\d+)\.\s*\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)\s*$/)
          if (mdListLink) {
            const [, number, label, href] = mdListLink
            return (
              <div key={idx} className="text-sm leading-relaxed whitespace-normal break-words">
                <span className="font-semibold mr-1">{number}.</span>
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{label}</a>
              </div>
            )
          }

          // Numbered list with bold title pattern remains
          const match = line.match(/^\s*(\d+)\.\s*\*\*(.+?)\*\*\s*:??\s*(.*)\s*$/)
          if (match) {
            const [, number, title, rest] = match
            const cleanedRest = (rest || '').replace(/^\s*[:：]\s*/, '')
            return (
              <div key={idx}>
                <div className="font-bold text-lg leading-snug">{`${number}. ${title}`}</div>
                {cleanedRest && <div className="mt-1 text-sm leading-relaxed whitespace-normal break-words">{renderInline(cleanedRest)}</div>}
              </div>
            )
          }
          return (
            <p key={idx} className="text-sm leading-relaxed whitespace-normal break-words">{renderInline(line)}</p>
          )
        })}
      </div>
    )
  }
  
  // Use the prop currentChatId if provided, otherwise use the hook's currentChatId
  let activeChatId = currentChatId || hookCurrentChatId

  // Update chat ID when prop changes
  useEffect(() => {
    if (currentChatId && currentChatId !== hookCurrentChatId) {
      console.log('ChatComposer: Setting current chat ID to:', currentChatId);
      setCurrentChatId(currentChatId);
    }
  }, [currentChatId, hookCurrentChatId, setCurrentChatId]);

  // Debug effect to log current state
  useEffect(() => {
    console.log('ChatComposer: Current state:', {
      currentChatId: hookCurrentChatId,
      propChatId: currentChatId,
      messagesCount: currentChatMessages.length,
      messages: currentChatMessages,
      isInitialized
    });
  }, [currentChatId, hookCurrentChatId, currentChatMessages, isInitialized]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (attachedPreviewUrl) URL.revokeObjectURL(attachedPreviewUrl)
    }
  }, [attachedPreviewUrl])

  // Scroll to bottom when messages change, but only if user is near bottom
  useEffect(() => {
    if (!messagesContainerRef.current || !messagesEndRef.current) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    if (isNearBottom) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [currentChatMessages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If image is attached for Aluda 2.0 and user also typed text, ensure image is ready first
    if (model === 'aluda2' && attachedImage && !attachedPreviewUrl) {
      await new Promise((r) => setTimeout(r, 50))
    }
    // Allow image-only request for Aluda 2.0
    if (!(message.trim().length > 0 || (model === 'aluda2' && attachedImage))) return

    const isImageOnly = model === 'aluda2' && attachedImage && message.trim().length === 0
    const messageToSend = isImageOnly ? '' : message.trim()

    console.log('ChatComposer: Submitting message, currentChatId:', currentChatId)

    // If no current chat, create one
    if (!activeChatId) {
      console.log('ChatComposer: No active chat, creating new one...')
      const newChatId = createNewChat()
      setCurrentChatId(newChatId)
      activeChatId = newChatId
    }

    // Prepare to send and only add message to UI after the request is started
    const pendingUserMessage: Omit<Message, 'timestamp'> = {
      id: `user_${Date.now()}`,
      role: "user",
      content: messageToSend,
    }
    setIsLoading(true)
    
    try {
      const useMultipart = model === 'aluda2' && attachedImage
      let responsePromise: Promise<Response>
      if (useMultipart) {
        const form = new FormData()
        if (messageToSend) form.append('message', messageToSend)
        form.append('chatId', activeChatId!)
        form.append('model', model)
        // Add multiple aliases to maximize compatibility with Flowise prediction endpoints
        form.append('files', attachedImage as Blob)
        form.append('file', attachedImage as Blob)
        form.append('files[]', attachedImage as Blob)
        form.append('image', attachedImage as Blob)
        form.append('images', attachedImage as Blob)
        responsePromise = fetch("/api/chat", { method: "POST", body: form })
      } else {
        responsePromise = fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageToSend, chatId: activeChatId, model }),
        })
      }

      // Immediately render the user's message without waiting for server reply
      addMessageToChat(activeChatId, pendingUserMessage)
      onChatCreated(activeChatId)
      setTimeout(() => setCurrentChatId(activeChatId), 50)
      setMessage("")

      const response = await responsePromise

      if (response.status === 402) {
        const data = await response.json().catch(() => ({}))
        if (data?.usage && data?.limits) {
          setUsageLimits({ usage: data.usage, limits: data.limits })
        }
        const redirect = data?.redirect as string | undefined
        const msg = data?.error as string | undefined
        if (redirect) {
          router.push(redirect)
          return
        }
        throw new Error(msg || 'ლიმიტი ამოიწურა')
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // Optional: if backend returns usage updates in future, sync here
      
      // Add assistant message
      const assistantMessage: Omit<Message, 'timestamp'> = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data.text || "ბოდიში, პასუხი ვერ მივიღე.",
      }
      
      console.log('ChatComposer: Adding assistant message:', assistantMessage)
      addMessageToChat(activeChatId, assistantMessage)

      // Clear attached image after successful send
      if (attachedImage) {
        setAttachedImage(null)
        if (attachedPreviewUrl) {
          URL.revokeObjectURL(attachedPreviewUrl)
          setAttachedPreviewUrl(null)
        }
      }
      
      // If backend suggested a title, apply it to the current chat
      if (data.aiTitle && typeof data.aiTitle === 'string' && currentChatMessages.length <= 1) {
        // Only rename once (after the first assistant reply), subsequent messages won't trigger rename
        renameChat(activeChatId, data.aiTitle)
      }
      
    } catch (err: any) {
      console.error("Chat error:", err)
      setError(err.message || "შეცდომა მოხდა")
    } finally {
      setIsLoading(false)
      // Always reset file input so user can reattach without page refresh
      try {
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (attachedImage) {
          setAttachedImage(null)
        }
        if (attachedPreviewUrl) {
          URL.revokeObjectURL(attachedPreviewUrl)
          setAttachedPreviewUrl(null)
        }
      } catch {}
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startNewChat = () => {
    if (!isInitialized) return;
    
    console.log('ChatComposer: Starting new chat...');
    const newChatId = createNewChat();
    console.log('ChatComposer: New chat created with ID:', newChatId);
    
    // Set the new chat as current
    setCurrentChatId(newChatId);
    
    // Notify parent component
    onChatCreated(newChatId);
  };

  // Don't render until initialized
  if (!isInitialized) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-blue-500" />
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <p className="text-gray-600 text-lg font-medium animate-fade-in-up">იტვირთება...</p>
            <p className="text-gray-400 text-sm mt-2 animate-fade-in-up-delay">მზად ვართ საუბრისთვის</p>
          </div>
        </div>
      </div>
    );
  }

  // Show refresh loading state
  if (isRefreshing) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <p className="text-gray-600 text-lg font-medium animate-fade-in-up">ქმნება ახალი ჩათი...</p>
            <p className="text-gray-400 text-sm mt-2 animate-fade-in-up-delay">გთხოვთ დაელოდოთ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 transition-colors duration-200 min-w-0">
      {/* Messages Area - Fixed height with scroll */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 chat-container"
        style={{ 
          height: 'calc(100dvh - 160px)',
          maxHeight: 'calc(100dvh - 160px)',
          overflowY: 'auto',
          // Avoid reflow jitter on some mobile browsers
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Welcome Message */}
        {currentChatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <MessageSquare className="h-10 w-10 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">მოგესალმებათ AludaAI</h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
              დაწერეთ რაიმე და დაიწყეთ საუბარი ჩვენს AI ასისტენტთან. 
              ჩვენ ვპასუხობთ ქართულ ენაზე!
            </p>
            <Suggestions onPick={(s) => setMessage(s)} />
          </div>
        ) : (
          <div className="space-y-4">
            {currentChatMessages.map((msg, index) => {
              const hasRendered = renderedMessageIdsRef.current.has(msg.id)
              const shouldAnimate = !hasRendered
              if (!hasRendered) renderedMessageIdsRef.current.add(msg.id)

              return (
              <div
                key={msg.id}
                className={`flex flex-nowrap items-start space-x-3 ${shouldAnimate ? 'animate-fade-in-up' : ''} ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
                style={shouldAnimate ? { animationDelay: `${index * 100}ms` } : undefined}
              >
                {/* Avatar - Only show for bot messages */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg chat-avatar">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Message Content */}
                <div className={`min-w-0 max-w-[70%] ${shouldAnimate ? 'animate-fade-in-left' : ''} flex flex-col ${
                  msg.role === 'user' ? 'items-end order-first' : 'items-start order-last'
                }`}>
                  <div className={`px-4 py-3 inline-block w-auto max-w-[60ch] md:max-w-[70ch] shadow-sm transition-all duration-200 hover:shadow-md chat-bubble ${
                    msg.role === 'user'
                      ? 'chat-bubble-user'
                      : 'chat-bubble-assistant dark:chat-bubble-assistant-dark'
                  }`}>
                    {msg.role === 'assistant' 
                      ? renderAssistantContent(msg.content)
                      : (
                        <p className="text-sm leading-relaxed whitespace-normal break-words">
                          {/* linkify user content */}
                          {(() => {
                            const urlSplitRegex = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/gi
                            return msg.content.split(urlSplitRegex).map((part, i) => {
                              const isUrl = /^(https?:\/\/|www\.)/i.test(part)
                              if (isUrl) {
                                const href = part.startsWith('http') ? part : `https://${part}`
                                return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{part}</a>
                              }
                              return <span key={i}>{part}</span>
                            })
                          })()}
                        </p>
                      )
                    }
                  </div>
                  <div className={`message-timestamp ${
                    msg.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString('ka-GE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>

                {/* Avatar - Only show for user messages */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg chat-avatar order-last">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            )})}
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3 animate-fade-in-up">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="max-w-[70%]">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">წერს...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start space-x-3 animate-fade-in-up">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <div className="w-5 h-5 text-white">⚠️</div>
            </div>
            <div className="max-w-[70%]">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl px-4 py-3 shadow-sm">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-900 p-4 md:p-6 transition-colors duration-200">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            {/* model switcher moved to Sidebar footer */}
            {/* Unified container with input, image button and send button */}
            <div className="flex items-end sm:items-center unified-input-container rounded-2xl sm:rounded-full px-3 sm:px-6 py-3 sm:py-4 transition-all duration-200">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (model !== 'aluda2') {
                    setError('სურათის გაგზავნა ხელმისაწვდომია მხოლოდ Aluda 2.0-ში')
                    e.currentTarget.value = ''
                    return
                  }
                  setAttachedImage(file)
                  const url = URL.createObjectURL(file)
                  setAttachedPreviewUrl(url)
                }}
              />
              {/* Image attach button (left of input) */}
              <button
                type="button"
                onClick={() => {
                  if (isLoading) return
                  if (model !== 'aluda2') {
                    setError('სურათის გაგზავნა ხელმისაწვდომია მხოლოდ Aluda 2.0-ში')
                    return
                  }
                  fileInputRef.current?.click()
                }}
                title={model !== 'aluda2' ? 'სურათის გაგზავნა ხელმისაწვდომია მხოლოდ Aluda 2.0-ში' : 'ატვირთე სურათი'}
                className={`mr-2 sm:mr-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
                  model === 'aluda2' ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                }`}
                disabled={model !== 'aluda2' || isLoading}
                aria-label="ატვირთე სურათი"
              >
                <ImageIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
              </button>

              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="დაწერეთ თქვენი შეტყობინება..."
                className="flex-1 resize-none bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base md:text-lg py-2 min-h-[24px] max-h-40"
                rows={1}
                disabled={isLoading}
              />
              
              <button
                type="submit"
                disabled={!(message.trim().length > 0 || (model === 'aluda2' && attachedImage)) || isLoading}
                className="ml-2 sm:ml-3 w-10 h-10 sm:w-12 sm:h-12 send-button bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Image preview chip */}
            {attachedPreviewUrl && (
              <div className="mt-2 flex items-center gap-2">
                <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                  <img src={attachedPreviewUrl} alt="attachment preview" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedImage(null)
                    if (attachedPreviewUrl) {
                      URL.revokeObjectURL(attachedPreviewUrl)
                      setAttachedPreviewUrl(null)
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                >
                  <X className="w-3 h-3" />
                  მოცილება
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
