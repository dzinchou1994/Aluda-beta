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
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false)

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

  // Close user panel on outside click or Escape
  useEffect(() => {
    if (!isUserPanelOpen) return
    const onDocClick = () => setIsUserPanelOpen(false)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsUserPanelOpen(false) }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [isUserPanelOpen])

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
            <div className="w-7 h-7 logo-gradient rounded-lg flex items-center justify-center mr-2">
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
        <a
          href="/image"
          className="mt-2 w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white rounded-lg hover:from-fuchsia-600 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <ImageIcon className="w-4.5 h-4.5" />
          <span className="text-sm">დააგენერირე სურათი</span>
        </a>
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
                  : "md:hover:bg-gray-50 md:dark:hover:bg-[#303030]"
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex-1 min-w-0">
                <h3 className={`text-xs font-normal truncate ${
                  currentChatId === chat.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {chat.title}
                </h3>
              </div>
              <div className={`relative transition-opacity ${openMenuChatId === chat.id ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}>
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
      
      {/* Footer: Collapsible User Panel (ChatGPT-style) */}
      <div className="p-2.5 border-t border-gray-200 dark:border-gray-800 relative">
        {session ? (
          <>
            {/* Collapsed row: avatar + username */}
            <div className="flex items-center justify-start gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setIsUserPanelOpen(prev => !prev) }}
                className="w-9 h-9 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all"
                title={isUserPanelOpen ? 'დახურვა' : 'მომხმარებლის ინფორმაცია'}
                aria-expanded={isUserPanelOpen}
              >
                <User className="w-4.5 h-4.5 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsUserPanelOpen(prev => !prev) }}
                className="flex-1 text-left text-xs font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400"
                title={session.user?.email || 'მომხმარებელი'}
                aria-label="მომხმარებლის ინფორმაცია"
              >
                {session.user?.name || session.user?.email}
              </button>
              {/* Premium Badge in collapsed row */}
              {(limits.daily > 25000 || (limits && limits.daily > 25000)) && (
                <div className="px-1.5 py-0.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-semibold rounded-full shadow-sm">
                  PREMIUM
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setSettingsOpen(true) }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md"
                title="პარამეტრები"
                aria-label="პარამეტრები"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Floating panel */}
            {isUserPanelOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute bottom-14 left-2 right-2 bg-white dark:bg-sidebar-dark border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3 space-y-3 animate-slide-up z-20"
              >
                {/* User Info Header */}
                <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-sidebar-dark rounded-lg">
                  <div className="w-7 h-7 bg-gray-600 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session.user?.name || session.user?.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {session.user?.email}
                    </p>
                  </div>
                  {/* Premium Badge */}
                  {(limits.daily > 25000 || (limits && limits.daily > 25000)) && (
                    <div className="px-2 py-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-semibold rounded-full shadow-sm">
                      PREMIUM
                    </div>
                  )}
                  <button
                    onClick={onSignOut}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="გამოსვლა"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* User Plan */}
                <div className="p-2 bg-gray-50 dark:bg-sidebar-dark rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">გეგმა</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      limits.daily > 0 && usage.daily / limits.daily >= 0.95
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                        : limits.daily > 25000 || (limits && limits.daily > 25000)
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    }`}>
                      {limits.daily > 0 && usage.daily / limits.daily >= 0.95 
                        ? 'ლიმიტი ამოწურული' 
                        : limits.daily > 25000 || (limits && limits.daily > 25000)
                          ? 'Premium'
                          : 'User'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {usage.daily}/{limits.daily} ტოკენი
                    </span>
                    {limits.daily > 0 && (
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${usage.daily / limits.daily >= 0.95 ? 'bg-red-500' : 'bg-blue-400'} h-2`}
                          style={{ width: `${Math.min(100, (usage.daily / limits.daily) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="flex items-center justify-center space-x-2 p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 text-xs"
                    title="პარამეტრები"
                  >
                    <span>⚙️</span>
                    <span>პარამეტრები</span>
                  </button>
                  {limits.daily > 0 && usage.daily / limits.daily >= 0.95 && (
                    <button
                      onClick={() => window.open('/buy', '_blank')}
                      className="flex items-center justify-center space-x-2 p-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 text-xs"
                      title="გახდი პრემიუმ"
                    >
                      <span>⭐</span>
                      <span>პრემიუმი</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-start gap-2">
            <div className="w-9 h-9 rounded-full bg-gray-400 dark:bg-gray-700 flex items-center justify-center">
              <User className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="flex-1 text-left text-xs font-medium text-gray-900 dark:text-white truncate">სტუმარი</span>
            <button
              onClick={onSignIn}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all"
              title="შესვლა"
              aria-label="შესვლა"
            >
              <LogIn className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
