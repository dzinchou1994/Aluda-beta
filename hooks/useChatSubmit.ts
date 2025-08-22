import { useState } from 'react';
import { Message } from '@/hooks/useChats';
import { compressImageIfNeeded } from '@/lib/chatUtils';

interface UseChatSubmitProps {
  model: string;
  currentChatId: string | null;
  createNewChat: () => string;
  addMessageToChat: (chatId: string, message: Omit<Message, 'timestamp'>) => void;
  onChatCreated: (chatId: string) => void;
  setCurrentChatId: (chatId: string) => void;
  setError: (error: string) => void;
}

export function useChatSubmit({
  model,
  currentChatId,
  createNewChat,
  addMessageToChat,
  onChatCreated,
  setCurrentChatId,
  setError,
}: UseChatSubmitProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent,
    message: string,
    attachedImage: File | null,
    attachedPreviewUrl: string | null,
    setAttachedImage: (file: File | null) => void,
    setAttachedPreviewUrl: (url: string | null) => void
  ) => {
    e.preventDefault();
    
    // If image is attached for Aluda 2.0 and user also typed text, ensure image is ready first
    if (model === 'aluda2' && attachedImage && !attachedPreviewUrl) {
      await new Promise((r) => setTimeout(r, 50));
    }
    
    // Allow image-only request for Aluda 2.0
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
    
    try {
      const useMultipart = model === 'aluda2' && attachedImage;
      let responsePromise: Promise<Response>;
      
      // Always use streaming for better UX
      const headers: Record<string, string> = {
        "Accept": "text/event-stream",
        "x-streaming": "true"
      };

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
          headers,
          body: form
        });
      } else {
        responsePromise = fetch("/api/chat", {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: messageToSend, chatId: activeChatId, model }),
        });
      }

      // Immediately render the user's message without waiting for server reply
      addMessageToChat(activeChatId, pendingUserMessage);
      onChatCreated(activeChatId);
      setTimeout(() => setCurrentChatId(activeChatId), 50);

      const response = await responsePromise;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        console.log('Processing streaming response...');
        
        // Create a placeholder AI message that we'll update in real-time
        const aiMessageId = `ai_${Date.now()}`;
        const placeholderMessage: Omit<Message, 'timestamp'> = {
          id: aiMessageId,
          role: "assistant",
          content: "",
        };
        addMessageToChat(activeChatId, placeholderMessage);

        // Process the stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body for streaming');
        }

        let fullContent = '';
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data:')) {
                const data = line.slice(5).trim();
                if (data === '[DONE]') break;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.event === 'token' && parsed.data) {
                    fullContent += parsed.data;
                    // Update the message content in real-time
                    const updatedMessage: Omit<Message, 'timestamp'> = {
                      id: aiMessageId,
                      role: "assistant",
                      content: fullContent,
                    };
                    addMessageToChat(activeChatId, updatedMessage);
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        console.log('Streaming complete, final content:', fullContent);
      } else {
        // Fallback to non-streaming response
        const responseData = await response.json();
        console.log('Non-streaming API response:', responseData);
        
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
        } else {
          console.warn('No AI content found in response:', responseData);
        }
      }

      // Auto-rename chat if it's new and AI provided a title
      // Note: This would need to be handled differently for streaming responses
      // For now, we'll skip auto-renaming in streaming mode

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
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSubmit,
  };
}
