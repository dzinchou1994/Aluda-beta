import { useState, useEffect, useCallback, useReducer } from 'react';
import { useSession } from 'next-auth/react';

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: string // Changed from Date to string since localStorage stores strings
  titleLocked?: boolean
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string // Changed from Date to string since localStorage stores strings
}

// Function to generate intelligent chat title based on first user message
function generateChatTitle(firstMessage: string): string {
  const message = firstMessage.trim().toLowerCase();
  
  // Common topics and their Georgian translations
  const topicMappings: { [key: string]: string } = {
    // Technology
    'javascript': 'JavaScript პროგრამირება',
    'python': 'Python პროგრამირება',
    'react': 'React დეველოპმენტი',
    'next.js': 'Next.js აპლიკაცია',
    'database': 'მონაცემთა ბაზა',
    'api': 'API დეველოპმენტი',
    'web': 'ვებ დეველოპმენტი',
    'mobile': 'მობილური აპლიკაცია',
    
    // Business
    'business': 'ბიზნეს სტრატეგია',
    'marketing': 'მარკეტინგი',
    'finance': 'ფინანსები',
    'startup': 'სტარტაპი',
    'investment': 'ინვესტიცია',
    
    // Education
    'education': 'განათლება',
    'learning': 'სწავლა',
    'study': 'სწავლა',
    'course': 'კურსი',
    'tutorial': 'ტუტორიალი',
    
    // Health
    'health': 'ჯანმრთელობა',
    'fitness': 'ფიტნესი',
    'nutrition': 'კვება',
    'medicine': 'მედიცინა',
    
    // General
    'help': 'დახმარება',
    'question': 'კითხვა',
    'advice': 'რჩევა',
    'problem': 'პრობლემა',
    'solution': 'გადაწყვეტა'
  };

  // Check for specific topics
  for (const [keyword, title] of Object.entries(topicMappings)) {
    if (message.includes(keyword)) {
      return title;
    }
  }

  // Check for question words
  const questionWords = ['რა', 'როგორ', 'სად', 'როდის', 'რატომ', 'ვინ', 'რომელი'];
  const hasQuestion = questionWords.some(word => message.includes(word));
  
  if (hasQuestion) {
    // Extract first meaningful phrase (up to 40 characters)
    const words = firstMessage.split(' ').slice(0, 6);
    const phrase = words.join(' ');
    return phrase.length > 40 ? phrase.substring(0, 40) + '...' : phrase;
  }

  // If no specific topic found, use first meaningful phrase
  const words = firstMessage.split(' ').slice(0, 5);
  const phrase = words.join(' ');
  
  if (phrase.length <= 30) {
    return phrase;
  } else {
    return phrase.substring(0, 30) + '...';
  }
}

// State interface
interface ChatState {
  chats: Chat[];
  currentChatId: string | undefined;
  isInitialized: boolean;
}

// Action types
type ChatAction = 
  | { type: 'SET_CHATS'; payload: Chat[] }
  | { type: 'SET_CURRENT_CHAT_ID'; payload: string | undefined }
  | { type: 'CREATE_CHAT'; payload: Chat }
  | { type: 'UPDATE_CHAT'; payload: { chatId: string; chat: Partial<Chat> } }
  | { type: 'DELETE_CHAT'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; message: Message } }
  | { type: 'SET_INITIALIZED'; payload: boolean };

// Reducer function
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  console.log('Reducer action:', action.type, action.payload);
  
  switch (action.type) {
    case 'SET_CHATS':
      return { ...state, chats: action.payload };
    
    case 'SET_CURRENT_CHAT_ID':
      console.log('Setting current chat ID to:', action.payload);
      return { ...state, currentChatId: action.payload };
    
    case 'CREATE_CHAT':
      console.log('Adding new chat:', action.payload.id);
      const newState = { 
        ...state, 
        chats: [action.payload, ...state.chats],
        currentChatId: action.payload.id
      };
      
      // Immediately save to localStorage
      try {
        localStorage.setItem('aluda_chats', JSON.stringify(newState.chats));
        localStorage.setItem('aluda_current_chat_id', action.payload.id);
        console.log('Reducer: Immediately saved new chat to localStorage');
      } catch (error) {
        console.error('Reducer: Error saving to localStorage:', error);
      }
      
      return newState;
    
    case 'UPDATE_CHAT':
      console.log('useChats: Updating chat:', action.payload)
      return {
        ...state,
        chats: state.chats.map(chat => 
          chat.id === action.payload.chatId 
            ? { ...chat, ...action.payload.chat }
            : chat
        )
      };
    
    case 'DELETE_CHAT':
      return {
        ...state,
        chats: state.chats.filter(chat => chat.id !== action.payload),
        currentChatId: state.currentChatId === action.payload ? undefined : state.currentChatId
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        chats: state.chats.map(chat => {
          if (chat.id === action.payload.chatId) {
            const updatedMessages = [...chat.messages, action.payload.message];
            
            // Update chat title based on first user message
            let newTitle = chat.title;
            const isGreeting = (text: string) => {
              const t = text.trim().toLowerCase();
              return [
                'გამარჯობა', 'hello', 'hi', 'hey', 'გაუმარჯოს', 'სალამი'
              ].some(g => t === g || t.startsWith(g + ' '));
            }
            // Only allow automatic title set once, and not on pure greeting
            const canAutoTitle = chat.messages.length === 0 && action.payload.message.role === 'user' && !isGreeting(action.payload.message.content)
            if (canAutoTitle && !chat.titleLocked) {
              newTitle = generateChatTitle(action.payload.message.content);
            }
            
            return {
              ...chat,
              title: newTitle,
              titleLocked: Boolean(chat.titleLocked) || (!!newTitle && newTitle !== chat.title),
              messages: updatedMessages
            };
          }
          return chat;
        })
      };
    
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    
    default:
      return state;
  }
}

export function useChats() {
  const { data: session } = useSession();

  // Create or get a stable guest id for anonymous users
  const getOrCreateGuestId = () => {
    try {
      const existing = localStorage.getItem('aluda_guest_id');
      if (existing) return existing;
      const newId = `guest_${Date.now()}`;
      localStorage.setItem('aluda_guest_id', newId);
      return newId;
    } catch {
      return 'guest_default';
    }
  };

  const storageKeyBase = session?.user?.id ? `user_${session.user.id}` : `guest_${typeof window !== 'undefined' ? (localStorage.getItem('aluda_guest_id') || 'default') : 'default'}`;
  const chatsKey = `aluda_chats_${storageKeyBase}`;
  const currentChatIdKey = `aluda_current_chat_id_${storageKeyBase}`;

  const [state, dispatch] = useReducer(chatReducer, {
    chats: [],
    currentChatId: undefined,
    isInitialized: false
  });

  const { chats, currentChatId, isInitialized } = state;

  // Load chats from localStorage on component mount or when user changes
  useEffect(() => {
    console.log('useChats: Loading from localStorage for key:', storageKeyBase);
    
    // Ensure we have a guest id for anonymous
    if (!session?.user?.id) {
      getOrCreateGuestId();
    }

    // Reset before loading new profile's chats
    dispatch({ type: 'SET_CHATS', payload: [] });
    dispatch({ type: 'SET_CURRENT_CHAT_ID', payload: undefined });
    dispatch({ type: 'SET_INITIALIZED', payload: false });

    try {
      const savedChats = localStorage.getItem(chatsKey);
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        // Ensure createdAt is properly formatted
        const formattedChats = parsedChats.map((chat: any) => ({
          ...chat,
          createdAt: chat.createdAt || new Date().toISOString(),
          messages: chat.messages || []
        }));
        dispatch({ type: 'SET_CHATS', payload: formattedChats });
        
        // Then set the current chat ID
        const savedCurrentChatId = localStorage.getItem(currentChatIdKey);
        if (savedCurrentChatId && formattedChats.find((chat: Chat) => chat.id === savedCurrentChatId)) {
          console.log('useChats: Restoring current chat ID:', savedCurrentChatId);
          dispatch({ type: 'SET_CURRENT_CHAT_ID', payload: savedCurrentChatId });
        } else if (formattedChats.length > 0) {
          const mostRecentChat = formattedChats[0];
          console.log('useChats: Selecting most recent chat:', mostRecentChat.id);
          dispatch({ type: 'SET_CURRENT_CHAT_ID', payload: mostRecentChat.id });
        }
      }
    } catch (error) {
      console.error('useChats: Error loading chats from localStorage:', error);
    } finally {
      console.log('useChats: Setting initialized to true');
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    }
  }, [storageKeyBase, session?.user?.id]);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    if (isInitialized) {
      try {
        console.log('useChats: Saving chats to localStorage:', chatsKey, chats);
        localStorage.setItem(chatsKey, JSON.stringify(chats));
      } catch (error) {
        console.error('useChats: Error saving chats to localStorage:', error);
      }
    }
  }, [chats, isInitialized, chatsKey]);

  // Save current chat ID to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        console.log('useChats: Saving current chat ID to localStorage:', currentChatIdKey, currentChatId);
        if (currentChatId) {
          localStorage.setItem(currentChatIdKey, currentChatId);
        } else {
          localStorage.removeItem(currentChatIdKey);
        }
      } catch (error) {
        console.error('useChats: Error saving current chat ID to localStorage:', error);
      }
    }
  }, [currentChatId, isInitialized, currentChatIdKey]);

  const createNewChat = useCallback(() => {
    const newChatId = `chat_${Date.now()}`
    const newChat: Chat = {
      id: newChatId,
      title: "ახალი საუბარი",
      messages: [],
      createdAt: new Date().toISOString(),
      titleLocked: false,
    }
    
    dispatch({ type: 'CREATE_CHAT', payload: newChat })
    return newChatId
  }, [dispatch])

  const selectChat = useCallback((chatId: string) => {
    console.log('useChats: Selecting chat:', chatId);
    console.log('useChats: Available chats:', chats.map(c => ({ id: c.id, title: c.title })));
    
    // If chat not found locally (e.g., after hard refresh), create it on the fly
    const chatExists = chats.find(chat => chat.id === chatId);
    if (!chatExists) {
      console.warn('useChats: Chat not found, creating stub:', chatId);
      const stub = {
        id: chatId,
        title: 'ახალი საუბარი',
        messages: [],
        createdAt: new Date().toISOString(),
        titleLocked: false,
      }
      dispatch({ type: 'CREATE_CHAT', payload: stub })
    }
    
    dispatch({ type: 'SET_CURRENT_CHAT_ID', payload: chatId });
    console.log('useChats: Current chat ID set to:', chatId);
  }, [chats]);

  const deleteChat = useCallback((chatId: string) => {
    console.log('useChats: Deleting chat:', chatId);
    dispatch({ type: 'DELETE_CHAT', payload: chatId });
  }, []);

  const renameChat = useCallback((chatId: string, title: string) => {
    const trimmed = (title || '').trim()
    if (!trimmed) return
    const chat = chats.find(c => c.id === chatId)
    if (chat?.titleLocked) {
      console.log('useChats: Title already locked, skipping rename:', chatId)
      return
    }
    console.log('useChats: Renaming chat:', { chatId, title: trimmed })
    dispatch({ type: 'UPDATE_CHAT', payload: { chatId, chat: { title: trimmed, titleLocked: true } } })
  }, [chats])

  const addMessageToChat = useCallback((chatId: string, message: Omit<Message, 'timestamp'>) => {
    console.log('useChats: Adding message to chat:', { chatId, message })
    
    const messageWithTimestamp: Message = {
      ...message,
      timestamp: new Date().toISOString()
    }
    
    console.log('useChats: Message with timestamp:', messageWithTimestamp)
    
    // Use reducer to append message to the correct chat to avoid stale closures
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        chatId,
        message: messageWithTimestamp
      }
    })
    
    console.log('useChats: Dispatch completed for chat update')
  }, [dispatch])

  const getCurrentChat = useCallback(() => {
    const currentChat = chats.find(chat => chat.id === currentChatId);
    console.log('useChats: Getting current chat:', currentChat, 'for ID:', currentChatId);
    return currentChat;
  }, [chats, currentChatId]);

  const getCurrentChatMessages = useCallback(() => {
    const currentChat = getCurrentChat();
    const messages = currentChat?.messages || [];
    console.log('useChats: Getting current chat messages:', messages, 'for chat:', currentChat);
    return messages;
  }, [getCurrentChat]);

  // Debug effect to log state changes
  useEffect(() => {
    if (isInitialized) {
      console.log('useChats: State changed:', { 
        currentChatId, 
        chatsCount: chats.length,
        isInitialized,
        chats: chats.map(c => ({ id: c.id, title: c.title, messagesCount: c.messages.length }))
      });
    }
  }, [currentChatId, chats, isInitialized]);

  const currentChat = getCurrentChat()
  const currentChatMessages = getCurrentChatMessages()

  const chatCreated = useCallback((chatId: string) => {
    console.log('useChats: Chat created callback:', chatId)
    // This function can be used for additional logic when a chat is created
  }, [])

  return {
    chats,
    currentChatId,
    currentChat,
    currentChatMessages,
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,
    addMessageToChat,
    setCurrentChatId: (chatId: string | undefined) => {
      console.log('useChats: setCurrentChatId called with:', chatId);
      dispatch({ type: 'SET_CURRENT_CHAT_ID', payload: chatId });
    },
    chatCreated,
    isInitialized
  };
}
