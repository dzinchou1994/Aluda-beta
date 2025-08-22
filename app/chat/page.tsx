"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import ChatComposer from "@/components/ChatComposer"
import Sidebar from "@/components/Sidebar"
import UserSettingsModal from "@/components/UserSettingsModal"
import { useChatsContext } from "@/context/ChatsContext"
import { Plus, User, LogIn, LogOut, Menu, X } from "lucide-react"
import ModelSwitcher from "@/components/ModelSwitcher"

export default function ChatPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
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
    <div className="flex h-screen bg-gray-50 dark:bg-chat-bg">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileSidebar}
          onPointerDown={closeMobileSidebar}
          onPointerUp={closeMobileSidebar}
        />
      )}
      
      {/* Sidebar */}
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
        showOnMobile={isMobileSidebarOpen}
      />
      
      {/* Main Chat Area */}
      <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-chat-bg">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-chat-bg border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
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
              <span className="text-xs text-gray-500 dark:text-gray-400">მოდელი:</span>
              <ModelSwitcher />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 md:space-x-4">
            <a
              href="/about"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hidden md:inline"
            >
              ჩვენს შესახებ
            </a>
            
            {/* User Profile or Sign In */}
            {session ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-black dark:to-gray-800 rounded-full flex items-center justify-center hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-400 transition"
                  title="პარამეტრები"
                  aria-label="გახსენი პარამეტრები"
                >
                  <User className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="გამოსვლა"
                  aria-label="გამოსვლა"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">შესვლა</span>
              </button>
            )}
          </div>
        </header>
        {isSettingsOpen && (
          <UserSettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} userEmail={session?.user?.email} />
        )}

        {/* Chat Content */}
        <div className="flex-1 min-h-0 overflow-hidden bg-gray-50 dark:bg-chat-bg transition-colors duration-200 min-w-0">
          <ChatComposer
            currentChatId={currentChatId}
            onChatCreated={handleChatCreated}
            session={session}
          />
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 z-40"
            onClick={closeMobileSidebar}
            onPointerDown={closeMobileSidebar}
          />
          <div className="absolute inset-y-0 left-0 w-[85vw] max-w-xs bg-white dark:bg-sidebar-dark shadow-xl flex z-50">
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
            className="absolute top-4 right-4 p-2 rounded-lg text-white bg-black/50 backdrop-blur z-[60]"
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
