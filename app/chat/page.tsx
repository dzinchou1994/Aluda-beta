"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import ChatComposer from "@/components/ChatComposer"
import Sidebar from "@/components/Sidebar"
import UserSettingsModal from "@/components/UserSettingsModal"
import { useChatsContext } from "@/context/ChatsContext"
import { Plus, User, LogIn, LogOut, Menu, X, MoreVertical } from "lucide-react"
import ModelSwitcher from "@/components/ModelSwitcher"

export default function ChatPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false)
  const { 
    chats, 
    currentChatId, 
    currentChat,
    createNewChat, 
    selectChat, 
    deleteChat,
    renameChat,
    chatCreated 
  } = useChatsContext()

  useEffect(() => {
    // Always allow access to chat, just show loading briefly
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  const handleNewChat = () => {
    // Creating a chat already sets currentChatId in the reducer.
    // Avoid immediately calling selectChat to prevent a duplicate stub chat.
    createNewChat()
  }

  const handleSelectChat = (chatId: string) => {
    selectChat(chatId)
    
    // Small delay to ensure state propagation
    setTimeout(() => {
      // Additional logic if needed
    }, 50)
  }

  const handleDeleteChat = (chatId: string) => {
    deleteChat(chatId)
  }

  const handleChatCreated = (chatId: string) => {
    chatCreated(chatId)
  }

  const handleSignIn = () => {
    signIn()
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/chat' })
  }

  // Mobile sidebar open/close helpers to avoid double-tap on touch devices
  const openMobileSidebar = useCallback(() => setIsMobileSidebarOpen(true), [])
  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), [])
  
  // Close top menu when clicking outside
  useEffect(() => {
    if (!isTopMenuOpen) return
    const onDocClick = () => setIsTopMenuOpen(false)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsTopMenuOpen(false) }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [isTopMenuOpen])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-gray-300 mx-auto mb-4"></div>
          <p className="text-gray-600">იტვირთება...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen min-h-[100dvh] bg-gray-50 dark:bg-chat-bg">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[55] md:hidden"
          onClick={closeMobileSidebar}
        />
      )}
      
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block sidebar-desktop">
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={renameChat}
          session={session}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          showOnMobile={false}
        />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-chat-bg">
        {/* Header */}
        <header className="md:sticky md:top-0 z-10 bg-white dark:bg-chat-bg border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
              onClick={openMobileSidebar}
              onPointerDown={openMobileSidebar}
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Model Switcher */}
            <div className="flex items-center space-x-2">
              <ModelSwitcher />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Top Menu Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsTopMenuOpen(!isTopMenuOpen)
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-lg transition-all duration-200"
                title="მენიუ"
                aria-label="გახსენი მენიუ"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {/* Dropdown Menu */}
              {isTopMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50 transform origin-top-right transition ease-out duration-150">
                  {/* About Link */}
                  <a
                    href="/about"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsTopMenuOpen(false)}
                  >
                    <div className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    ჩვენს შესახებ
                  </a>
                  
                  {/* Terms of Service Link */}
                  <a
                    href="/terms"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setIsTopMenuOpen(false)}
                  >
                    <div className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    წესები და პირობები
                  </a>
                  
                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  
                  {/* User Profile or Sign In */}
                  {session ? (
                    <>
                      <button
                        onClick={() => {
                          setIsSettingsOpen(true)
                          setIsTopMenuOpen(false)
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        პარამეტრები
                      </button>
                      
                      <button
                        onClick={() => {
                          handleSignOut()
                          setIsTopMenuOpen(false)
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <div className="w-4 h-4 mr-3 text-red-500 dark:text-red-400">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        გამოსვლა
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        handleSignIn()
                        setIsTopMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      მომხმარებლის ცენტრი
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        {isSettingsOpen && (
          <UserSettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} userEmail={session?.user?.email} />
        )}

        {/* Chat Content */}
        <div className="flex-1 min-h-0 overflow-hidden bg-gray-50 dark:bg-chat-bg transition-colors duration-200 min-w-0 chat-content-mobile">
          <ChatComposer
            currentChatId={currentChatId}
            onChatCreated={handleChatCreated}
            session={session}
          />
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-[999] md:hidden">
          <div
            className="absolute inset-0 bg-black/40 z-[1000]"
            onClick={closeMobileSidebar}
            onPointerDown={closeMobileSidebar}
          />
          <div className="absolute inset-y-0 left-0 w-[85vw] max-w-xs bg-white dark:bg-sidebar-dark shadow-xl flex z-[1001]">
            <Sidebar
              chats={chats}
              currentChatId={currentChatId}
              onNewChat={() => { closeMobileSidebar(); handleNewChat() }}
              onSelectChat={(id) => { closeMobileSidebar(); handleSelectChat(id) }}
              onDeleteChat={(id) => { closeMobileSidebar(); handleDeleteChat(id) }}
              onRenameChat={(id, title) => { closeMobileSidebar(); renameChat(id, title) }}
              session={session}
              onSignIn={() => { closeMobileSidebar(); handleSignIn() }}
              onSignOut={() => { closeMobileSidebar(); handleSignOut() }}
              showOnMobile
            />
          </div>
          <button
            className="absolute top-4 right-4 p-2 rounded-lg text-white bg-black/50 backdrop-blur z-[1002]"
            onClick={closeMobileSidebar}
            onPointerDown={closeMobileSidebar}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}