'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, User, Bot, MessageSquare, Plus, Image as ImageIcon, X } from 'lucide-react';
import { useChats, Message } from '@/hooks/useChats';
import { useChatsContext } from '@/context/ChatsContext';
import { useTokens } from '@/context/TokensContext';
import ModelSwitcher from '@/components/ModelSwitcher';
import { useModel } from '@/context/ModelContext';
import { Session } from 'next-auth';

// Time formatting helpers
const formatShortTime = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('ka-GE', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
  } catch {
    return ''
  }
}

const formatFullDateTime = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('ka-GE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return ''
  }
}

function Suggestions({ onPick }: { onPick: (s: string) => void }) {
  const [topics, setTopics] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
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
    }
    // initial load
    load()
    // refresh every 10 minutes
    refreshTimerRef.current = setInterval(load, 10 * 60 * 1000)
    return () => { 
      isMounted = false
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    }
  }, [])

  const fallbackPool = useMemo(() => [
    'მირჩიე ფილმი საღამოსთვის',
    'რა ხდება საქართველოში?',
    'მასწავლე საინტერესო ფაქტი',
    'მირჩიე ადგილი ტურიზმისთვის',
    'როგორ გავაუმჯობესო ძილის ხარისხი?',
    'რას მირჩევ კარიერულ განვითარებაში?',
    'მასწავლე ახალი ქართული ანდაზა',
    'რა მოვამზადო სწრაფად და გემრიელად?',
    'მირჩიე სასარგებლო წიგნი',
    'მასწავლე რაღაცა ტექნოლოგიებზე',
    'მირჩიე ექსკურსიის მარშრუტი',
    'რა ვარჯიშები გავაკეთო სახლში?'
  ], [])
  const randomizedFallback = useMemo(() => {
    const arr = [...fallbackPool]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr.slice(0, 4)
  }, [fallbackPool])
  const items = (topics && topics.length > 0 ? topics : randomizedFallback).slice(0, 4)

  return (
    <div className="mt-6 flex flex-wrap gap-3 justify-center">
      {items.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          onClick={() => onPick(suggestion)}
          className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 shadow-sm hover:shadow-md animate-fade-in-up"
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
    isInitialized,
    updateMessageInChat
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
  const forceScrollRef = useRef<boolean>(false)
  const [attachedImage, setAttachedImage] = useState<File | null>(null)
  const [attachedPreviewUrl, setAttachedPreviewUrl] = useState<string | null>(null)
  // removed dynamic input height padding logic to prevent extra space on mobile

  // Compress large images on the client before uploading to avoid 413 Payload Too Large
  async function compressImageIfNeeded(original: File): Promise<Blob> {
    try {
      const sizeLimitBytes = 1.5 * 1024 * 1024 // ~1.5MB
      if (original.size <= sizeLimitBytes) return original
      const objectUrl = URL.createObjectURL(original)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = reject
        i.src = objectUrl
      })
      const maxDim = 1280
      const ratio = Math.min(1, maxDim / Math.max(img.width, img.height))
      const targetW = Math.max(1, Math.round(img.width * ratio))
      const targetH = Math.max(1, Math.round(img.height * ratio))
      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, targetW, targetH)
      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b || original), 'image/jpeg', 0.82)
      })
      URL.revokeObjectURL(objectUrl)
      return blob
    } catch {
      return original
    }
  }

  // Reusable framed block with copy button
  // (Removed copy-frame helper)

  // Render assistant content with special formatting; support markdown links [text](url)
  function renderAssistantContent(content: string) {
    // (Removed HTML auto-frame pretty print to avoid swallowing surrounding text)

    // Code fence parsing: allow optional whitespace/newline after language
    // Examples: ```html\n... or ```html ...
    const fenceRegex = /```(\w+)?[\t ]*\n?([\s\S]*?)```/g
    const parts: Array<{ type: 'code' | 'text'; lang?: string; text: string }> = []
    let lastIdx = 0
    let m: RegExpExecArray | null
    let foundFence = false
    while ((m = fenceRegex.exec(content)) !== null) {
      foundFence = true
      const before = content.slice(lastIdx, m.index)
      if (before.trim()) parts.push({ type: 'text', text: before })
      parts.push({ type: 'code', lang: m[1] || undefined, text: m[2] })
      lastIdx = m.index + m[0].length
    }
    const tail = content.slice(lastIdx)
    if (tail.trim()) parts.push({ type: 'text', text: tail })

    // If no code fences, continue to text formatter (no HTML framing)

    // If fences were found, render split parts (code + text) without copy frames
    if (foundFence) {
      const CopyButton = ({ text }: { text: string }) => {
        const [copied, setCopied] = useState(false)
        const handleCopy = async () => {
          try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          } catch {}
        }
        return (
          <button
            type="button"
            onClick={handleCopy}
            aria-label="კოპირება"
            className="absolute top-2 right-2 z-10 text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 backdrop-blur"
          >
            {copied ? 'კოპირებულია' : 'კოპირება'}
          </button>
        )
      }
      // Helper for links
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

      return (
        <div className="space-y-3">
          {parts.map((p, idx) => {
            if (p.type === 'code') {
              return (
                <div key={`code-${idx}`} className="mt-2 relative">
                  <CopyButton text={p.text} />
                  <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 font-mono text-[12.5px] leading-5 whitespace-pre-wrap break-words overflow-x-auto">
                    <code>{p.text}</code>
                  </pre>
                </div>
              )
            }
            const txt = p.text.trim()
            return <p key={`txt-${idx}`} className="text-sm leading-relaxed whitespace-normal break-words">{renderPlainLinks(txt)}</p>
          })}
        </div>
      )
    }

    // Fallback: improved formatter (lists, bullets, headings) — only used when no code fences
    // Normalize: split single-line lists into separate lines for better readability
    let normalized = content
      // force newlines before every numbered item occurrence
      .replace(/\s+(\d+)\.\s/g, (_m, n) => `\n${n}. `)
      // force newlines before every bullet occurrence
      .replace(/\s+-\s+/g, () => "\n- ")
      // ensure headings that appear inline start on a new line (global)
      .replace(/\s+(#{1,6})\s/g, (_m, hashes) => "\n" + String(hashes) + " ")
      .trim()

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

    // Markdown inline: [text](url), bold **text** or __text__, and plain URLs
    const renderInline = (text: string) => {
      const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
      const elements: any[] = []
      let lastIndex = 0
      let match: RegExpExecArray | null

      const renderBold = (txt: string) => {
        const nodes: any[] = []
        let cursor = 0
        const strongRe = /\*\*([^*]+)\*\*|__([^_]+)__/g
        let sm: RegExpExecArray | null
        while ((sm = strongRe.exec(txt)) !== null) {
          const before = txt.slice(cursor, sm.index)
          if (before) nodes.push(<span key={`sb-${cursor}`}>{before}</span>)
          const boldText = sm[1] || sm[2]
          nodes.push(<strong key={`st-${cursor}`}>{boldText}</strong>)
          cursor = sm.index + sm[0].length
        }
        const tailTxt = txt.slice(cursor)
        if (tailTxt) nodes.push(<span key={`se-${cursor}`}>{tailTxt}</span>)
        return nodes
      }

      const processText = (txt: string) => {
        const urlSplitRegex = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/gi
        const parts = txt.split(urlSplitRegex)
        const nodes: any[] = []
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          if (!part) continue
          const isUrl = /^(https?:\/\/|www\.)/i.test(part)
          if (isUrl) {
            const href = part.startsWith('http') ? part : `https://${part}`
            nodes.push(
              <a key={`u-${lastIndex}-${i}`} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{part}</a>
            )
          } else {
            nodes.push(...renderBold(part))
          }
        }
        return nodes
      }

      while ((match = mdRegex.exec(text)) !== null) {
        const [full, label, href] = match
        const before = text.slice(lastIndex, match.index)
        if (before) elements.push(...processText(before))
        elements.push(
          <a key={`a-${match.index}`} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
            {label}
          </a>
        )
        lastIndex = match.index + full.length
      }
      const tail = text.slice(lastIndex)
      if (tail) elements.push(...processText(tail))
      return elements
    }

    const lines = normalized.split(/\r?\n/).filter(l => l.trim().length > 0)
    const blocks: JSX.Element[] = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const mdHeading = line.match(/^\s*#{1,6}\s*(.+?)\s*$/)
      if (mdHeading) {
        const full = mdHeading[1].trim()
        // If heading line also contains more text (e.g., "### Title ... more text"),
        // split at the earliest reasonable separator and render the rest as a paragraph.
        let headingText = full
        let afterText = ''
        const numberMatch = /\s+\d+\.\s/.exec(full)
        const bulletMatch = /\s+-\s+/.exec(full)
        const colonIdx = full.indexOf(':')
        const periodIdx = full.indexOf('.')
        const candidateIdxs = [
          numberMatch ? numberMatch.index : -1,
          bulletMatch ? bulletMatch.index : -1,
          colonIdx,
          periodIdx
        ].filter((idx) => idx !== -1)
        if (candidateIdxs.length > 0) {
          const splitIdx = Math.min(...candidateIdxs)
          headingText = full.slice(0, splitIdx).trim()
          afterText = full.slice(splitIdx).trim()
          // remove leading punctuation or list markers from the paragraph
          afterText = afterText.replace(/^[:\.\-\s]*/, '')
        }
        blocks.push(
          <div key={`h-${i}`} className="mt-4 mb-1">
            <div className="font-bold text-xl leading-snug">{headingText}</div>
          </div>
        )
        if (afterText) {
          blocks.push(
            <p key={`hp-${i}`} className="mt-2 text-sm leading-relaxed whitespace-normal break-words">{renderInline(afterText)}</p>
          )
        }
        continue
      }

      // Numbered list where item is a markdown link: allow optional spaces around ()
      const mdListLink = line.match(/^\s*(\d+)\.\s*\[([^\]]+)\]\s*\(\s*(https?:\/\/[^\s)]+)\s*\)\s*$/)
      if (mdListLink) {
        const [, number, label, href] = mdListLink
        const next = lines[i + 1]
        const desc = next && next.match(/^\s*-\s+(.+)\s*$/)
        blocks.push(
          <div key={`li-${i}`} className="mt-2 text-sm leading-relaxed whitespace-normal break-words">
            <span className="font-semibold mr-1">{number}.</span>
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{label}</a>
            {desc ? <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{renderInline(desc[1])}</div> : null}
          </div>
        )
        if (desc) i += 1
        continue
      }

      // Numbered list with bold title pattern
      const boldMatch = line.match(/^\s*(\d+)\.\s*\*\*(.+?)\*\*\s*:??\s*(.*)\s*$/)
      if (boldMatch) {
        const [, number, title, rest] = boldMatch
        const cleanedRest = (rest || '').replace(/^\s*[:：]\s*/, '')
        blocks.push(
          <div key={`b-${i}`} className="mt-3">
            <div className="font-bold text-base leading-snug">{`${number}. ${title}`}</div>
            {cleanedRest && <div className="mt-1 text-sm leading-relaxed whitespace-normal break-words">{renderInline(cleanedRest)}</div>}
          </div>
        )
        continue
      }

      // Numbered list with plain title pattern: 1. Title: text
      const plainMatch = line.match(/^\s*(\d+)\.\s*([^:]+):\s*(.*)\s*$/)
      if (plainMatch) {
        const [, number, title, rest] = plainMatch
        blocks.push(
          <div key={`p-${i}`} className="mt-3">
            <div className="font-bold text-base leading-snug">{`${number}. ${title.trim()}`}</div>
            {rest && <div className="mt-1 text-sm leading-relaxed whitespace-normal break-words">{renderInline(rest)}</div>}
          </div>
        )
        continue
      }

      // Bullet line: - text
      const bullet = line.match(/^\s*-\s+(.+)\s*$/)
      if (bullet) {
        blocks.push(
          <div key={`bu-${i}`} className="mt-1 text-sm leading-relaxed whitespace-normal break-words">• {renderInline(bullet[1])}</div>
        )
        continue
      }

      blocks.push(
        <p key={`p-${i}`} className="mt-2 text-sm leading-relaxed whitespace-normal break-words">{renderInline(line)}</p>
      )
    }
    return <div className="space-y-2">{blocks}</div>
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

  // Scroll to bottom when messages change. If user is near bottom, keep pinned.
  // If a new message was just sent (forceScrollRef), force scrolling regardless.
  useEffect(() => {
    if (!messagesContainerRef.current || !messagesEndRef.current) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    if (isNearBottom || forceScrollRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        forceScrollRef.current = false;
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
      imageUrl: attachedPreviewUrl || undefined,
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
        // Compress large images to prevent 413 and reduce latency
        const blobToSend = await compressImageIfNeeded(attachedImage as File)
        const filename = (attachedImage as File).name || 'upload.jpg'
        // Add multiple aliases to maximize compatibility with Flowise prediction endpoints
        form.append('files', blobToSend, filename)
        form.append('file', blobToSend, filename)
        form.append('files[]', blobToSend, filename)
        form.append('image', blobToSend, filename)
        form.append('images', blobToSend, filename)
        responsePromise = fetch("/api/chat", { 
          method: "POST", 
          body: form
        })
      } else {
        responsePromise = fetch("/api/chat", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: messageToSend, chatId: activeChatId, model }),
        })
      }

      // Immediately render the user's message without waiting for server reply
      addMessageToChat(activeChatId, pendingUserMessage)
      onChatCreated(activeChatId)
      setTimeout(() => setCurrentChatId(activeChatId), 50)
      setMessage("")
      // Force scroll to the newest message even if user had scrolled up
      forceScrollRef.current = true
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      })

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
        let serverMsg = ''
        try {
          const errJson = await response.json()
          serverMsg = errJson?.error || errJson?.message || ''
        } catch {}
        throw new Error(serverMsg || `HTTP error! status: ${response.status}`)
      }

      // Handle response (non-streaming for now)
      const data = await response.json()
      console.log('API result meta:', data.__meta)
      
      // Add assistant message with typing effect
      const assistantMessage: Omit<Message, 'timestamp'> = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: "",
      }
      
      console.log('ChatComposer: Adding assistant message:', assistantMessage)
      addMessageToChat(activeChatId, assistantMessage)
      
      // End loading state before typing to avoid duplicate loaders
      setIsLoading(false)

      // Simulate typing effect (fast, dynamic)
      const fullText = data.text || "ბოდიში, პასუხი ვერ მივიღე."
      const words = fullText.split(/\s+/)
      let currentText = ""
      // Dynamic per-word delay so long answers don't feel sluggish (2x faster)
      const perWordMs = Math.max(30, Math.min(90, Math.round(1200 / Math.max(words.length, 1))))

      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, perWordMs))
        currentText += (i > 0 ? " " : "") + words[i]
        
        // Update the existing assistant message content incrementally
        updateMessageInChat(activeChatId, assistantMessage.id, { content: currentText })
      }

      // If server suggested a concise title and the current chat still has the default title, apply it
      try {
        const aiTitle = (data && typeof data.aiTitle === 'string') ? data.aiTitle.trim() : ''
        if (aiTitle && activeChatId) {
          const current = chats.find(c => c.id === activeChatId)
          if (current && (!current.titleLocked && (current.title === 'ახალი საუბარი' || !current.title || current.title.trim().length === 0))) {
            renameChat(activeChatId, aiTitle)
          }
        }
      } catch {}

      // Clear attached image after successful send
      if (attachedImage) {
        setAttachedImage(null)
        if (attachedPreviewUrl) {
          URL.revokeObjectURL(attachedPreviewUrl)
          setAttachedPreviewUrl("")
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error)
      setError(error.message || "შეცდომა მოხდა შეტყობინების გაგზავნისას.")
      
      // Add error message to chat
      const errorMessage: Omit<Message, 'timestamp'> = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: `❌ ${error.message || "შეცდომა მოხდა შეტყობინების გაგზავნისას."}`,
      }
      addMessageToChat(activeChatId, errorMessage)
    } finally {
      setIsLoading(false)
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
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-chat-bg">
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

  // Show refresh loading state
  if (isRefreshing) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-chat-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <div className="absolute inset-0 bg-gray-500/20 dark:bg-gray-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <p className="text-gray-600 text-lg font-medium animate-fade-in-up">ქმნება ახალი ჩათი...</p>
            <p className="text-gray-400 text-sm mt-2 animate-fade-in-up-delay">გთხოვთ დაელოდოთ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-chat-bg transition-colors duration-200 min-w-0">
      {/* Messages Area - Fixed height with scroll */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-white dark:bg-chat-bg overscroll-contain"
        style={{ 
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Welcome Message */}
        {currentChatMessages.length === 0 ? (
          <div className="flex flex-col items-center text-center animate-fade-in md:justify-center md:h-full mt-6">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800/50 dark:to-gray-700/50 rounded-full flex items-center justify-center mb-8 md:mb-6 animate-bounce">
              <MessageSquare className="h-8 w-8 md:h-10 md:w-10 text-gray-700 dark:text-gray-200" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-3">მოგესალმებათ AludaAI</h3>
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
                {/* Message Content - User messages with bubbles, AI messages as simple text */}
                <div className={`min-w-0 max-w-full md:max-w-[70%] ${shouldAnimate ? 'animate-fade-in-left' : ''} flex flex-col ${
                  msg.role === 'user' ? 'items-end order-first' : 'items-start order-last'
                }`}>
                  {msg.role === 'user' ? (
                    // User message with bubble
                    <div className="px-4 py-3 inline-block w-auto max-w-[60ch] md:max-w-[70ch] shadow-sm transition-all duration-200 hover:shadow-md chat-bubble chat-bubble-user">
                      <div className="space-y-2">
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="attachment" className="rounded-md border border-gray-200 dark:border-gray-700 max-w-full" />
                        )}
                        {msg.content && (
                          <p className="text-sm leading-relaxed whitespace-normal break-words">
                            {/* linkify user content */}
                            {(() => {
                              const urlSplitRegex = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/gi
                              return msg.content.split(urlSplitRegex).map((part, i) => {
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
                    // AI message as simple text
                    <div className="w-full text-gray-900 dark:text-white text-sm leading-relaxed whitespace-normal break-words">
                      {renderAssistantContent(msg.content)}
                    </div>
                  )}
                  {/* Timestamp */}
                  <div className={`${msg.role === 'user' ? 'text-right' : 'text-left'} mt-1`}> 
                    <time
                      dateTime={(msg as any).timestamp}
                      title={formatFullDateTime((msg as any).timestamp)}
                      className="text-[11px] text-gray-400 dark:text-gray-500"
                    >
                      {formatShortTime((msg as any).timestamp)}
                    </time>
                  </div>
                </div>
              </div>
            )})}
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed md:sticky bottom-0 md:bottom-0 left-0 right-0 md:left-auto md:right-auto z-20 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-chat-bg">
        <div className="max-w-4xl mx-auto p-3">
          <form onSubmit={handleSubmit} className="relative">
            {/* model switcher moved to Sidebar footer */}
            {/* Unified container with input, image button and send button */}
            <div className="flex items-end sm:items-center unified-input-container bg-white dark:bg-input-bg border border-gray-300 dark:border-gray-700 rounded-xl p-3 shadow-sm transition-all duration-200">
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
                className="ml-2 sm:ml-3 w-10 h-10 sm:w-12 sm:h-12 send-button bg-gradient-to-r from-blue-500 to-purple-600 dark:from-gray-700 dark:to-gray-500 text-white rounded-full hover:from-blue-600 hover:to-purple-700 dark:hover:from-gray-600 dark:hover:to-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105"
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
