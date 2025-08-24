import { useState } from 'react';
import { Message } from '@/hooks/useChats';
import { compressImageIfNeeded } from '@/lib/chatUtils';

interface UseChatSubmitProps {
  model: string;
  currentChatId: string | null;
  createNewChat: () => string;
  addMessageToChat: (chatId: string, message: Omit<Message, 'timestamp'>) => void;
  updateMessageInChat: (chatId: string, messageId: string, changes: Partial<Message>) => void;
  onChatCreated: (chatId: string) => void;
  setCurrentChatId: (chatId: string) => void;
  setError: (error: string) => void;
  renameChat: (chatId: string, title: string) => void;
  getCurrentChatMessages: () => Message[];
}

export function useChatSubmit({
  model,
  currentChatId,
  createNewChat,
  addMessageToChat,
  updateMessageInChat,
  onChatCreated,
  setCurrentChatId,
  setError,
  renameChat,
  getCurrentChatMessages,
}: UseChatSubmitProps) {
  const [isLoading, setIsLoading] = useState(false);

  const forceScrollBottom = () => {
    try {
      const container = document.querySelector('.messages-container-spacing') as HTMLElement | null
      if (container) {
        container.dataset.userScrolled = 'false'
        container.scrollTop = container.scrollHeight
      }
    } catch {}
  }

  const handleSubmit = async (
    e: React.FormEvent,
    message: string,
    attachedImage: File | null,
    attachedPreviewUrl: string | null,
    setAttachedImage: (file: File | null) => void,
    setAttachedPreviewUrl: (url: string | null) => void,
    setMessage: (message: string) => void
  ) => {
    e.preventDefault();
    
    // OPTIMIZATION: Reduce image preparation delay
    if (model === 'aluda2' && attachedImage && !attachedPreviewUrl) {
      await new Promise((r) => setTimeout(r, 25)); // Reduced from 50ms to 25ms
    }
    
    // Allow image-only request for Aluda 2.0, but not for test model
    if (!(message.trim().length > 0 || (model === 'aluda2' && attachedImage))) return;

    const isImageOnly = model === 'aluda2' && attachedImage && message.trim().length === 0;
    const messageToSend = isImageOnly ? '' : message.trim();

    console.log('ChatComposer: Submitting message, currentChatId:', currentChatId);

    // If no current chat, create one
    let activeChatId = currentChatId;
    if (!activeChatId) {
      console.log('ChatComposer: No active chat, creating new one...');
      const newChatId = createNewChat();
      setCurrentChatId(newChatId);
      activeChatId = newChatId;
    }

    // Prepare to send and only add message to UI after the request is started
    const pendingUserMessage: Omit<Message, 'timestamp'> = {
      id: `user_${Date.now()}`,
      role: "user",
      content: messageToSend,
      imageUrl: attachedPreviewUrl || undefined,
    };
    
    setIsLoading(true);

    // CLEAR INPUT IMMEDIATELY ON SEND (decouple from AI response)
    setMessage("");
    
    try {
      const useMultipart = model === 'aluda2' && attachedImage;
      let responsePromise: Promise<Response>;
      
      if (useMultipart) {
        const form = new FormData();
        if (messageToSend) form.append('message', messageToSend);
        form.append('chatId', activeChatId!);
        form.append('model', model);
        
        // Compress large images to prevent 413 and reduce latency
        const blobToSend = await compressImageIfNeeded(attachedImage as File);
        const filename = (attachedImage as File).name || 'upload.jpg';
        
        // Add multiple aliases to maximize compatibility with Flowise prediction endpoints
        form.append('files', blobToSend, filename);
        form.append('file', blobToSend, filename);
        form.append('files[]', blobToSend, filename);
        form.append('image', blobToSend, filename);
        form.append('images', blobToSend, filename);
        
        responsePromise = fetch("/api/chat", { 
          method: "POST",
          body: form
        });
      } else {
        // Get current chat history to send to API
        const currentMessages = getCurrentChatMessages();
        // Convert to format expected by API (exclude the message we're about to send)
        const historyForAPI = currentMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        console.log('Frontend: Sending history to API:', historyForAPI.length, 'messages');
        
        responsePromise = fetch("/api/chat", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            message: messageToSend, 
            chatId: activeChatId, 
            model,
            history: historyForAPI
          }),
        });
      }

      // OPTIMIZATION: Immediately render the user's message and reduce delay
      addMessageToChat(activeChatId, pendingUserMessage);
      onChatCreated(activeChatId);
      setTimeout(() => setCurrentChatId(activeChatId), 25); // Reduced from 50ms to 25ms

      const response = await responsePromise;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Check if response supports streaming
      const contentType = response.headers.get('content-type');
      const isStreaming = contentType?.includes('text/event-stream');
      
      console.log('Client-side: Response headers check:', {
        contentType,
        isStreaming,
        allHeaders: Object.fromEntries(response.headers.entries())
      });
      
      if (isStreaming) {
        console.log('Client-side: Starting streaming response handling...');
        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body for streaming');
        }
        
        // Create AI message for streaming
        const aiMessageId = `ai_${Date.now()}`;
        const aiMessage: Omit<Message, 'timestamp'> = {
          id: aiMessageId,
          role: "assistant",
          content: "",
        };
        console.log('Client-side: Adding AI message to chat:', aiMessage);
        addMessageToChat(activeChatId, aiMessage);
        // Force scroll when AI starts answering
        forceScrollBottom();
        
        let fullContent = '';
        const decoder = new TextDecoder();
        
        try {
          console.log('Client-side: Starting to read stream...');
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Client-side: Stream reading done');
              break;
            }
            
            const chunk = decoder.decode(value);
            console.log('Client-side: Received chunk:', chunk);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const data = line.slice(5).trim();
                console.log('Client-side: Processing data line:', data);
                
                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.event === 'end') {
                    console.log('Streaming ended, final content:', fullContent);
                    break;
                  } else if (parsed.event === 'token' && parsed.data) {
                    fullContent += parsed.data;
                    console.log('Received token:', parsed.data, 'Full content so far:', fullContent);
                    // Update the message content in real-time
                    updateMessageInChat(activeChatId, aiMessageId, { content: fullContent });
                  } else if (parsed.event === 'start') {
                    console.log('Streaming started');
                  } else {
                    console.log('Unknown event:', parsed.event, parsed);
                  }
                } catch (e) {
                  console.log('Parse error:', e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Handle non-streaming response
        const responseData = await response.json();
        console.log('API response:', responseData);
        
        if (responseData.error) {
          throw new Error(responseData.error);
        }

        // Add AI response to chat - handle different response formats
        let aiContent = responseData.content || responseData.text || responseData.message || responseData.response;
        if (aiContent) {
          const aiMessage: Omit<Message, 'timestamp'> = {
            id: `ai_${Date.now()}`,
            role: "assistant",
            content: aiContent,
          };
          console.log('Adding AI message:', aiMessage);
          addMessageToChat(activeChatId, aiMessage);
          // Force scroll when AI message appears
          forceScrollBottom();
        } else {
          console.warn('No AI content found in response:', responseData);
        }

        // Auto-rename chat if AI provided a title
        if (responseData.aiTitle && responseData.aiTitle.trim()) {
          console.log('AI suggested title:', responseData.aiTitle);
          renameChat(activeChatId, responseData.aiTitle.trim());
        }
      }

      // Note: For streaming responses, we skip auto-renaming for now

      // Clear attached image after successful send
      if (attachedImage) {
        setAttachedImage(null);
        if (attachedPreviewUrl) {
          URL.revokeObjectURL(attachedPreviewUrl);
          setAttachedPreviewUrl("");
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setError(error.message || "შეცდომა მოხდა შეტყობინების გაგზავნისას.");
      
      // Add error message to chat
      const errorMessage: Omit<Message, 'timestamp'> = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: `❌ ${error.message || "შეცდომა მოხდა შეტყობინების გაგზავნისას."}`,
      };
      addMessageToChat(activeChatId!, errorMessage);
      // Ensure errors also bring the view to the bottom so user sees it
      forceScrollBottom();
    } finally {
      // Reset loading state only (input was already cleared on send)
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSubmit,
  };
}
