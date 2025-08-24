'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Send, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { useModel } from '@/context/ModelContext';

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  attachedImage: File | null;
  setAttachedImage: (file: File | null) => void;
  attachedPreviewUrl: string | null;
  setAttachedPreviewUrl: (url: string | null) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function ChatInput({
  message,
  setMessage,
  attachedImage,
  setAttachedImage,
  attachedPreviewUrl,
  setAttachedPreviewUrl,
  isLoading,
  onSubmit,
  onKeyDown,
  onFocus,
  onInputChange,
}: ChatInputProps) {
  const { model } = useModel();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobileUA, setIsMobileUA] = useState(false);
  const [mobileRows, setMobileRows] = useState(1);
  const lineHeightRef = useRef<number>(20);

  useEffect(() => {
    try {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      setIsMobileUA(/iPhone|iPad|iPod|Android/i.test(ua))
    } catch {}
  }, []);

  // Measure actual line-height once the textarea is mounted
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    try {
      const cs = getComputedStyle(el)
      const lh = parseFloat(cs.lineHeight || '20')
      if (!Number.isNaN(lh) && lh > 0) lineHeightRef.current = lh
    } catch {}
  }, []);

  // Auto-resize textarea (desktop only)
  const autoResize = useCallback(() => {
    if (isMobileUA) return; // Avoid JS-driven resize on mobile to prevent flicker
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // Cap height via CSS max-height; overflow handled via CSS
    el.style.height = `${el.scrollHeight}px`;
  }, [isMobileUA]);

  // Recalculate height/rows whenever message changes (including programmatic clears)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return

    if (!isMobileUA) {
      autoResize();
      return
    }

    // On mobile: use fixed height to prevent layout shifts
    // Don't change rows dynamically as it causes jumping
    if (mobileRows !== 1) {
      setMobileRows(1)
      el.rows = 1
    }
  }, [message, autoResize, isMobileUA, mobileRows]);

  const handleImageAttach = () => {
    if (isLoading) return;
    if (model !== 'aluda2') {
      // You might want to show an error message here
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (model !== 'aluda2') {
      // You might want to show an error message here
      e.currentTarget.value = '';
      return;
    }
    
    setAttachedImage(file);
    const url = URL.createObjectURL(file);
    setAttachedPreviewUrl(url);
  };

  const removeImage = () => {
    setAttachedImage(null);
    if (attachedPreviewUrl) {
      URL.revokeObjectURL(attachedPreviewUrl);
      setAttachedPreviewUrl(null);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-chat-bg shadow-lg z-50 mobile-input-fixed md:relative md:bottom-auto md:left-auto md:right-auto md:shadow-none md:z-auto">
      <div className="max-w-4xl mx-auto px-3 pb-3 pt-1 md:px-3 md:pb-3 md:pt-1" id="chat-input-wrapper">
        <form onSubmit={onSubmit} className="relative">
          {/* Unified container with input, image button and send button */}
          <div className="flex items-center unified-input-container bg-white dark:bg-input-bg border border-gray-300 dark:border-gray-700 rounded-xl p-2 md:p-3 shadow-sm transition-colors md:rounded-xl rounded-lg md:border md:border-gray-300 md:dark:border-gray-700">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            
            {/* Image attach button (left of input) */}
            <button
              type="button"
              onClick={handleImageAttach}
              title={model !== 'aluda2' ? 'სურათის გაგზავნა ხელმისაწვდომია მხოლოდ Aluda 2.0-ში' : 'ატვირთე სურათი'}
              className={`mr-2 sm:mr-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
                model === 'aluda2' ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed'
              }`}
              disabled={model !== 'aluda2' || isLoading}
              aria-label="ატვირთე სურათი"
            >
              <ImageIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
            </button>

            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                onInputChange(e);
                // Only auto-resize on desktop to prevent mobile layout shifts
                if (!isMobileUA) {
                  requestAnimationFrame(autoResize);
                }
              }}
              onKeyDown={onKeyDown}
              onFocus={(e) => {
                onFocus();
                // Let the useChatScroll hook handle the scrolling
                // No additional scroll logic here to prevent conflicts
              }}
              placeholder="მკითხე რაც გინდა"
              className="auto-resize flex-1 resize-none bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base md:text-lg py-2 min-h-[24px] max-h-[35vh] md:max-h-[40vh] overflow-y-auto"
              rows={isMobileUA ? mobileRows : 1}
              disabled={isLoading}
            />
            
            <button
              type="submit"
              disabled={!(message.trim().length > 0 || (model === 'aluda2' && attachedImage)) || isLoading}
              className="ml-2 sm:ml-3 w-10 h-10 sm:w-12 sm:h-12 send-button bg-blue-500 dark:bg-blue-600 text-white rounded-full hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Image preview chip */}
          {attachedPreviewUrl && (
            <div className="mt-2 flex items-center gap-2">
              <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                <img src={attachedPreviewUrl} alt="attachment preview" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
              >
                <X className="w-3 h-3" />
                მოცილება
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
