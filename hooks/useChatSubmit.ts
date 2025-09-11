import { useState } from 'react';
import { useTokens } from '@/context/TokensContext';
import { Message } from '@/hooks/useChats';
import { compressImageIfNeeded, fileToBase64 } from '@/lib/chatUtils';
import { suggestTitleWithAI } from '@/lib/flowise';

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
  const useFlowiseProxy = process.env.NEXT_PUBLIC_USE_FLOWISE === 'true';
  const { refresh: refreshTokens } = useTokens();

  const forceScrollBottom = () => {
    const scrollOnce = () => {
      const container = document.querySelector('.messages-container-spacing') as HTMLElement | null
      if (container) {
        container.dataset.userScrolled = 'false'
        container.scrollTop = container.scrollHeight
      }
    }
    try {
      // Immediate attempt
      scrollOnce()
      // Next paint
      requestAnimationFrame(() => {
        scrollOnce()
        // Short delay to ensure DOM has appended new nodes
        setTimeout(scrollOnce, 30)
        setTimeout(scrollOnce, 80)
      })
    } catch {}
  }

  const handleSubmit = async (
    e: React.FormEvent,
    message: string,
    attachedImage: File | null,
    attachedPreviewUrl: string | null,
    attachedImages: File[],
    attachedPreviewUrls: string[],
    setAttachedImage: (file: File | null) => void,
    setAttachedPreviewUrl: (url: string | null) => void,
    setAttachedImages: (files: File[]) => void,
    setAttachedPreviewUrls: (urls: string[]) => void,
    setMessage: (message: string) => void
  ) => {
    e.preventDefault();
    
    // Capture attachments for sending, then immediately clear UI state so
    // thumbnails disappear right after user hits send
    const sendAttachedImage: File | null = attachedImage;
    const sendAttachedImages: File[] = (attachedImages || []).slice();
    const sendPreviewUrl: string | null = attachedPreviewUrl;
    const sendPreviewUrls: string[] = (attachedPreviewUrls || []).slice();

    try {
      if (sendPreviewUrl) {
        try { URL.revokeObjectURL(sendPreviewUrl); } catch {}
      }
      if (sendPreviewUrls && sendPreviewUrls.length > 0) {
        try { sendPreviewUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch {} }); } catch {}
      }
    } catch {}
    // Clear UI state (safe because we kept local copies above)
    setAttachedImage(null);
    setAttachedPreviewUrl(null);
    setAttachedImages([]);
    setAttachedPreviewUrls([]);

    // OPTIMIZATION: Reduce image preparation delay
    if (model === 'plus' && (sendAttachedImage || (sendAttachedImages && sendAttachedImages.length > 0)) && !sendPreviewUrl) {
      await new Promise((r) => setTimeout(r, 25)); // Reduced from 50ms to 25ms
    }
    
    // Allow image-only request for both Aluda 2.0 and test model
    if (!(message.trim().length > 0 || sendAttachedImage || (sendAttachedImages && sendAttachedImages.length > 0))) return;

    const isImageOnly = (sendAttachedImage || (sendAttachedImages && sendAttachedImages.length > 0)) && message.trim().length === 0;
    const messageToSend = isImageOnly ? '' : message.trim();

    // Determine if foreign scripts should be allowed based on explicit user intent
    const allowCyrillicOrCJK = (() => {
      const q = (messageToSend || '').toLowerCase();
      const patterns = [
        /რუსულ(ად|ზე|ში)?/i, // Georgian: "in Russian"
        /ჩინურ(ად|ზე|ში)?/i, // Georgian: "in Chinese"
        /გადათარგმ(ნ|ნე|ნოთ|ნოს)/i, // Georgian variants of "translate"
        /translate\b/i,
        /in\s+russian/i,
        /write\s+in\s+russian/i,
        /на\s+русском/i,
        /по-русски/i,
        /russian/i,
        /in\s+chinese/i,
        /write\s+in\s+chinese/i,
        /中文|汉语|汉字/i,
        /chinese/i,
      ];
      return patterns.some((re) => re.test(q));
    })();

    const cleanStreamingToken = (raw: string): string => {
      if (!raw) return '';
      let t = String(raw);
      // Remove [DONE] markers that might leak through
      t = t.replace(/\[DONE\]/g, '');
      // Normalize some common fullwidth punctuation
      t = t.replace(/，/g, ',').replace(/。/g, '.').replace(/！/g, '!').replace(/？/g, '?').replace(/：/g, ':').replace(/；/g, ';');
      // Remove zero-width characters
      t = t.replace(/[\u200B-\u200D\uFEFF]/g, '');
      // Normalize long dashes to simple hyphen for consistent rendering
      t = t.replace(/[–—]/g, '-');
      if (!allowCyrillicOrCJK) {
        // Strip CJK Unified Ideographs and Cyrillic blocks when not explicitly requested
        t = t.replace(/[\u4e00-\u9fff]/g, '');
        t = t.replace(/[\u0400-\u04FF]/g, '');
      }
      // Collapse only spaces/tabs, PRESERVE newlines for paragraphs and lists
      t = t.replace(/[ \t]+/g, ' ');
      return t;
    };

    // Strip any trailing Flowise agent logs (e.g., {"event":"usedTools", ...}) that sometimes leak at the end
    const stripTrailingToolLogs = (raw: string): string => {
      if (!raw) return '';
      let txt = raw;
      try {
        txt = txt.replace(/\{\s*"event"\s*:\s*"usedTools"[\s\S]*$/i, '').trim();
        txt = txt.replace(/\{\s*"event"\s*:\s*"[^"]+"[\s\S]*$/i, '').trim();
      } catch {}
      return txt;
    };

    console.log('ChatComposer: Submitting message, currentChatId:', currentChatId);

    // If no current chat, create one
    let activeChatId = currentChatId;
    let createdNewChat = false;
    if (!activeChatId) {
      console.log('ChatComposer: No active chat, creating new one...');
      const newChatId = createNewChat();
      setCurrentChatId(newChatId);
      activeChatId = newChatId;
      createdNewChat = true;
    }

    // Convert image to base64 for persistent storage
    let imageBase64: string | undefined;
    let imageBase64List: string[] = [];
    const filesToConvert = sendAttachedImages && sendAttachedImages.length > 0 ? sendAttachedImages : (sendAttachedImage ? [sendAttachedImage] : []);
    if (filesToConvert.length > 0) {
      for (const f of filesToConvert) {
        try {
          imageBase64List.push(await fileToBase64(f));
        } catch (error) {
          console.error('Failed to convert image to base64:', error);
        }
      }
      imageBase64 = imageBase64List[0];
    }

    // Prepare to send and only add message to UI after the request is started
    const pendingUserMessage: Omit<Message, 'timestamp'> = {
      id: `user_${Date.now()}`,
      role: "user",
      content: messageToSend,
      imageUrl: imageBase64 || sendPreviewUrl || (sendPreviewUrls && sendPreviewUrls[0]) || undefined,
      imageUrls: imageBase64List.length > 0 ? imageBase64List : (sendPreviewUrls && sendPreviewUrls.length > 0 ? sendPreviewUrls : undefined),
    };
    
    setIsLoading(true);

    // CLEAR INPUT IMMEDIATELY ON SEND (decouple from AI response)
    setMessage("");
    
    try {
      const useMultipart = (sendAttachedImage || (sendAttachedImages && sendAttachedImages.length > 0)) && (model === 'plus' || model === 'free');
      let responsePromise: Promise<Response>;
      
      if (useMultipart) {
        const form = new FormData();
        if (messageToSend) form.append('message', messageToSend);
        form.append('chatId', activeChatId!);
        form.append('model', model);
        
        const files = filesToConvert;
        for (const f of files) {
          const blobToSend = await compressImageIfNeeded(f);
          const filename = f.name || 'upload.jpg';
          form.append('files', blobToSend, filename);
          form.append('file', blobToSend, filename);
          form.append('files[]', blobToSend, filename);
          form.append('image', blobToSend, filename);
          form.append('images', blobToSend, filename);
        }
        
        responsePromise = fetch("/api/chat", { 
          method: "POST",
          body: form
        });
      } else {
        if (useFlowiseProxy) {
          // Use non-stream proxy for now
          responsePromise = fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: messageToSend, overrideConfig: { renderHTML: true } }),
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

          // Decide if we should trigger title suggestion (only on very first user message with text)
          const shouldSuggestTitle = (createdNewChat || historyForAPI.length === 0) && messageToSend.length > 0;
          
          // Request streaming SSE from our API
          responsePromise = fetch("/api/chat", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "text/event-stream",
              "x-streaming": "true"
            },
            body: JSON.stringify({ 
              message: messageToSend, 
              chatId: activeChatId, 
              model,
              history: historyForAPI
            }),
          });

          // Fire-and-forget title suggestion so the UI does not wait
          if (shouldSuggestTitle) {
            (async () => {
              try {
                const aiTitle = await suggestTitleWithAI({
                  question: messageToSend,
                  sessionId: activeChatId!,
                });
                const trimmed = (aiTitle || '').trim();
                // Only rename if Flowise returns a non-empty title; otherwise keep default "ახალი საუბარი"
                if (trimmed) {
                  renameChat(activeChatId!, trimmed);
                }
              } catch (e) {
                console.warn('Flowise title suggestion failed:', e);
              }
            })();
          }
        }
      }

      // OPTIMIZATION: Immediately render the user's message and reduce delay
      addMessageToChat(activeChatId, pendingUserMessage);
      onChatCreated(activeChatId);
      setTimeout(() => setCurrentChatId(activeChatId), 25); // Reduced from 50ms to 25ms

      // Title generation: call suggest API immediately; fallback to first line if slow
      if (createdNewChat && messageToSend) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2200);
        (async () => {
          try {
            const res = await fetch('/api/chat/title', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ question: messageToSend, sessionId: activeChatId }),
              signal: controller.signal,
            });
            if (res.ok) {
              const { title } = await res.json();
              const trimmed = (title || '').trim();
              if (trimmed) renameChat(activeChatId!, trimmed);
              return;
            }
          } catch {}
          finally { clearTimeout(timer); }
          // Fallback
          const firstLine = messageToSend.split(/\n+/)[0].trim();
          const noPunct = firstLine.replace(/[.!?\-—–,:;]+$/g, '').trim();
          const limited = noPunct.length > 42 ? (noPunct.slice(0, 42).trim() + '…') : noPunct;
          if (limited) renameChat(activeChatId!, limited);
        })();
      }

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
        
        let gotAnyToken = false;
        let hidLoader = false;
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

            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line) continue;
              if (!line.startsWith('data:')) continue;

              const data = line.slice(5).trim();
              if (!data) continue;

              console.log('Client-side: Processing data line:', data);

              let added = false;
              try {
                const parsed = JSON.parse(data);
                if (parsed && typeof parsed === 'object') {
                  if (parsed.event === 'end' || parsed.data === '[DONE]') {
                    console.log('Streaming ended, final content:', fullContent);
                    // do not mark added; we'll exit after loop
                    break;
                  }
                  if (parsed.event === 'start') {
                    // ignore
                  } else if (parsed.event === 'metadata') {
                    // ignore metadata objects entirely
                  } else if (parsed.event === 'token') {
                    const tokenRaw = typeof parsed.data === 'string' ? parsed.data : '';
                    const token = cleanStreamingToken(tokenRaw);
                    if (token) {
                      fullContent += token;
                      gotAnyToken = true;
                      if (!hidLoader) { setIsLoading(false); hidLoader = true; }
                      added = true;
                    }
                  } else {
                    // Fallback only for string fields
                    const token = cleanStreamingToken(
                      (typeof parsed.data === 'string' ? parsed.data
                        : typeof parsed.text === 'string' ? parsed.text
                        : typeof parsed.message === 'string' ? parsed.message
                        : typeof parsed.answer === 'string' ? parsed.answer
                        : '')
                    );
                    if (token) {
                      fullContent += token;
                      gotAnyToken = true;
                      if (!hidLoader) { setIsLoading(false); hidLoader = true; }
                      added = true;
                    }
                  }
                }
              } catch {
                // Not JSON – treat as raw token content
                if (data !== '[DONE]' && data.trim() !== '[DONE]') {
                  const token = cleanStreamingToken(data);
                  if (token && token.trim() !== '[DONE]') {
                    fullContent += token;
                    gotAnyToken = true;
                    if (!hidLoader) { setIsLoading(false); hidLoader = true; }
                    added = true;
                  }
                }
              }

              if (added) {
                updateMessageInChat(activeChatId, aiMessageId, { content: fullContent });
                forceScrollBottom();
              }
            }
          }
        } finally {
          reader.releaseLock();
          // Fallback if upstream advertised SSE but sent nothing useful
          if (!gotAnyToken && fullContent.length === 0) {
            try {
              const fb = await fetch('/api/flowise', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: messageToSend, overrideConfig: { renderHTML: true } }) });
              const ct2 = fb.headers.get('content-type') || '';
              let text = '';
              if (ct2.includes('application/json')) {
                const js = await fb.json();
                text = js?.content || js?.text || js?.response || '';
              } else {
                text = await fb.text();
              }
              updateMessageInChat(activeChatId, aiMessageId, { content: text || ' ' });
              forceScrollBottom();
            } catch {}
          }
          // Final cleanup: strip any trailing tool logs and [DONE] markers accidentally surfaced
          try {
            let cleaned = stripTrailingToolLogs(fullContent);
            // Remove any remaining [DONE] markers
            cleaned = cleaned.replace(/\[DONE\]/g, '').trim();
            if (cleaned !== fullContent) {
              fullContent = cleaned;
              updateMessageInChat(activeChatId, aiMessageId, { content: fullContent });
              forceScrollBottom();
            }
          } catch {}
        }
      } else {
        // Handle non-streaming response
        let aiContent: string | undefined;
        let responseData: any = undefined;
        try {
          const contentTypeNonStream = contentType || '';
          if (contentTypeNonStream.includes('text/html')) {
            aiContent = await response.text();
          } else if (contentTypeNonStream.includes('text/plain')) {
            aiContent = await response.text();
          } else {
            responseData = await response.json();
          }
        } catch {
          // Fallback: read as text to avoid JSON parse errors on HTML
          aiContent = await response.text();
        }
        if (responseData) {
          console.log('API response:', responseData);
          if (responseData.error) {
            throw new Error(responseData.error);
          }
          aiContent = aiContent || responseData.content || responseData.text || responseData.message || responseData.response;
          if (aiContent && !allowCyrillicOrCJK) {
            aiContent = cleanStreamingToken(aiContent);
          }
        }

        // Add AI response to chat - handle different response formats (HTML or text)
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
        if (responseData && responseData.aiTitle && typeof responseData.aiTitle === 'string' && responseData.aiTitle.trim()) {
          console.log('AI suggested title:', responseData.aiTitle);
          renameChat(activeChatId, responseData.aiTitle.trim());
        }
      }

      // Note: For streaming responses, we skip auto-renaming for now

      // Clear attached image after successful send
      // No-op: attachments were already cleared at send time
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
      try {
        // Refresh token usage/limits in the background so Settings reflects latest counts
        void refreshTokens();
      } catch {}
    }
  };

  return {
    isLoading,
    handleSubmit,
  };
}
