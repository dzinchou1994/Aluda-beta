"use client"

import { MessageSquare, Trash2, Plus, LogIn, LogOut, User, MoreVertical, Pencil, Brain, FileText } from "lucide-react"
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
  isLoading?: boolean // Add loading prop
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
  showOnMobile = false,
  isLoading = false
}: SidebarProps) {
  const { usage, limits } = useTokens()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { model, setModel } = useModel()
  const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null)
  const [showImageSoon, setShowImageSoon] = useState(false)
  const hideImageSoonTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ensure loading state is properly handled
  const shouldShowLoading = isLoading || session === undefined || (session && !session.user)

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
        </div>
        
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus className="w-4.5 h-4.5" />
          <span className="text-sm">ახალი საუბარი</span>
        </button>
        {/* Quick actions separator */}
        <div className="my-3">
          <div className="border-t border-gray-200 dark:border-gray-800"></div>
        </div>
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href="/image"
            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-md bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 transition-colors dark:bg-[#2a1f2a] dark:text-fuchsia-300"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-[11px] font-medium">სურათი</span>
          </a>
          <a
            href="/docs"
            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors dark:bg-[#23253a] dark:text-indigo-300"
          >
            <FileText className="w-4 h-4" />
            <span className="text-[11px] font-medium">დოკუმენტი</span>
          </a>
        </div>
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
                    className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-sidebar-dark border border-gray-200 dark:border-gray-800 rounded-md shadow-lg py-1 z-50 transform origin-top-right transition ease-out duration-150"
                    style={{ marginTop: '0.25rem' }}
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
        {shouldShowLoading ? (
          // Loading state - show skeleton
          <div className="flex items-center justify-start gap-2">
            <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
            <div className="flex-1 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse max-w-[120px]"></div>
          </div>
        ) : session ? (
          <>
            {/* Collapsed row: avatar + username */}
            <div className="flex items-center justify-start gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setSettingsOpen(true) }}
                className="w-9 h-9 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 transition-all"
                title="პარამეტრები"
                aria-label="პარამეტრები"
              >
                <User className="w-4.5 h-4.5 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSettingsOpen(true) }}
                className="flex-1 text-left text-xs font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400"
                title={session.user?.email || 'მომხმარებელი'}
                aria-label="პარამეტრები"
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

            {/* Large user panel removed - no more hover/click panel */}
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
