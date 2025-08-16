"use client"

import { MessageSquare, Trash2, Plus, LogIn, LogOut, User, Sun, Moon, MoreVertical, Pencil } from "lucide-react"
import { useTokens } from '@/context/TokensContext'
import UserSettingsModal from './UserSettingsModal'
import ModelSwitcher from './ModelSwitcher'
import { useModel } from '@/context/ModelContext'
import { Session } from "next-auth"
import { useState, useEffect, useRef } from "react"
import { Image as ImageIcon } from "lucide-react"
 

interface SidebarProps {
  chats: Array<{
    id: string
    title: string
    createdAt: string | Date
  }>
  currentChatId?: string
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  // optional external rename hook; if not provided we fallback to prompt
  onRenameChat?: (chatId: string, title: string) => void
  session: Session | null
  onSignIn: () => void
  onSignOut: () => void
  showOnMobile?: boolean
}

export default function Sidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  session,
  onSignIn,
  onSignOut,
  showOnMobile = false
}: SidebarProps) {
  const [isDark, setIsDark] = useState(false)
  const { usage, limits } = useTokens()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { model, setModel } = useModel()
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null)
  const [showImageSoon, setShowImageSoon] = useState(false)
  const hideImageSoonTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (hideImageSoonTimeout.current) {
        clearTimeout(hideImageSoonTimeout.current)
      }
    }
  }, [])

  // Close the context menu on outside click or Escape
  useEffect(() => {
    if (!openMenuChatId) return
    const onDocClick = () => setOpenMenuChatId(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMenuChatId(null) }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenuChatId])

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('aluda-theme')
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('aluda-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('aluda-theme', 'light')
    }
  }

  // Helper function to format date
  const formatDate = (date: string | Date) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString("ka-GE")
    }
    return date.toLocaleDateString("ka-GE")
  }

  return (
    <div className={`${showOnMobile ? 'flex w-full' : 'hidden md:flex md:w-72 lg:w-80'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col h-full transition-colors duration-200`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AludaAI</h2>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
            title={isDark ? "Light Mode" : "Dark Mode"}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>ახალი საუბარი</span>
        </button>
        {/* Generate Image CTA under New Chat */}
        <button
          onClick={() => {
            setShowImageSoon(true)
            if (hideImageSoonTimeout.current) {
              clearTimeout(hideImageSoonTimeout.current)
            }
            hideImageSoonTimeout.current = setTimeout(() => {
              setShowImageSoon(false)
              hideImageSoonTimeout.current = null
            }, 3000)
          }}
          className="mt-2 w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white rounded-lg hover:from-fuchsia-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <ImageIcon className="w-4 h-4" />
          <span>დააგენერირე სურათი</span>
        </button>
        {showImageSoon && (
          <div className="mt-2 text-center">
            <div className="inline-block px-3 py-1 text-xs rounded-md border border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-900/20 dark:text-pink-300 shadow-sm">
              სერვისი მალე დაემატება
            </div>
          </div>
        )}
        
        {/* Authentication Section */}
        {session ? (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {session.user?.name || session.user?.email}
              </p>
              <p
                className={`text-xs ${
                  limits.daily > 0 && usage.daily / limits.daily >= 0.95
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {usage.daily}/{limits.daily} ტოკენი
              </p>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="პარამეტრები"
            >
              ⚙️
            </button>
            <button
              onClick={onSignOut}
              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="გამოსვლა"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">სტუმარი</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{usage.daily}/{limits.daily} დღეს · {usage.monthly}/{limits.monthly} თვეში</p>
              </div>
            </div>
            <button
              onClick={onSignIn}
              className="mt-3 w-full flex items-center justify-center space-x-2 p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              <span>შესვლა</span>
            </button>
          </div>
        )}
      </div>
      {settingsOpen && (
        <UserSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} userEmail={session?.user?.email} />
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {chats.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">ჩათები არ არის</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">დაიწყეთ ახალი საუბარი</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                currentChatId === chat.id
                  ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {chat.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(chat.createdAt)}
                </p>
              </div>
              <div className={`relative transition-opacity ${openMenuChatId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenMenuChatId(prev => prev === chat.id ? null : chat.id)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md"
                  title="მეტი"
                  aria-haspopup="menu"
                  aria-expanded={openMenuChatId === chat.id}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openMenuChatId === chat.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-20 transform origin-top-right transition ease-out duration-150"
                  >
                    <button
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        const currentTitle = chat.title
                        const next = prompt('ჩატის გადარქმევა', currentTitle || '')
                        if (next && next.trim()) {
                          onRenameChat?.(chat.id, next.trim())
                          setOpenMenuChatId(null)
                        }
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" /> გადარქმევა
                    </button>
                    <button
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuChatId(null)
                        onDeleteChat(chat.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> წაშლა
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer: Model Switcher */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">მოდელი</span>
          <ModelSwitcher
            value={model}
            onChange={(v) => {
              if (v === 'aluda2' && !session) {
                onSignIn()
                return
              }
              setModel(v)
            }}
            disabledAluda2={false}
          />
        </div>
      </div>
    </div>
  )
}
