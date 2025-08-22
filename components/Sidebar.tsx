"use client"

import { MessageSquare, Trash2, Plus, LogIn, LogOut, User, Sun, Moon, MoreVertical, Pencil, Brain } from "lucide-react"
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

  return (
    <div className={`${showOnMobile ? 'flex w-full' : 'hidden md:flex md:w-56 lg:w-64'} bg-white dark:bg-sidebar-dark border-r border-gray-200 dark:border-gray-800 flex-col h-full transition-colors duration-200`}>
      {/* Header */}
      <div className="p-2.5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <a href="/chat" className="flex items-center" aria-label="AludaAI">
            <div className="w-7 h-7 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-black dark:to-gray-800 rounded-lg flex items-center justify-center mr-2">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">AludaAI</h2>
          </a>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-lg transition-all duration-200"
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
          <Plus className="w-4.5 h-4.5" />
          <span className="text-sm">ახალი საუბარი</span>
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
          <ImageIcon className="w-4.5 h-4.5" />
          <span className="text-sm">დააგენერირე სურათი</span>
        </button>
        {showImageSoon && (
          <div className="mt-2 text-center">
            <div className="inline-block px-3 py-1 text-xs rounded-md border border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-900/20 dark:text-pink-300 shadow-sm">
              სერვისი მალე დაემატება
            </div>
          </div>
        )}
      </div>
      {settingsOpen && (
        <UserSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} userEmail={session?.user?.email} />
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
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
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                currentChatId === chat.id
                  ? "bg-gray-100 dark:bg-[#242424] border border-gray-300 dark:border-gray-800"
                  : "hover:bg-gray-50 dark:hover:bg-[#303030]"
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex-1 min-w-0">
                <h3 className={`text-xs font-medium truncate ${
                  currentChatId === chat.id ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  {chat.title}
                </h3>
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
                    className="absolute right-0 mt-2 w-40 bg-white dark:bg-sidebar-dark border border-gray-200 dark:border-gray-800 rounded-md shadow-lg py-1 z-20 transform origin-top-right transition ease-out duration-150"
                  >
                    <button
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-sidebar-dark"
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
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-sidebar-dark"
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
      
      {/* Footer: Authentication Section */}
      <div className="p-2.5 border-t border-gray-200 dark:border-gray-800">
        {/* Authentication Section */}
        {session ? (
          <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-sidebar-dark rounded-lg">
            <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-black dark:to-gray-800 rounded-full flex items-center justify-center">
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
              className="p-1 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
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
          <div className="p-2 bg-gray-50 dark:bg-sidebar-dark rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <button
                  onClick={onSignIn}
                  className="text-xs font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  სტუმარი
                </button>
              </div>
              <button
                onClick={onSignIn}
                className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-xs"
              >
                <LogIn className="w-3 h-3" />
                <span>შესვლა</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
