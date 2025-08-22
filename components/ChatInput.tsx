'use client';

import { useRef, useState } from 'react';
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
    <div className="relative bg-white dark:bg-chat-bg shadow-lg border-t border-gray-200 dark:border-gray-700 md:border-t-0 mobile-input-container">
      <div className="max-w-4xl mx-auto p-4 md:p-3 md:px-3">
        <form onSubmit={onSubmit} className="relative">
          {/* Unified container with input, image button and send button */}
          <div className="flex items-end sm:items-center unified-input-container bg-white dark:bg-input-bg border border-gray-300 dark:border-gray-700 rounded-xl p-3 shadow-sm transition-all duration-200 md:rounded-xl rounded-lg md:border md:border-gray-300 md:dark:border-gray-700">
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
              value={message}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              placeholder="დაწერეთ თქვენი შეტყობინება..."
              className="flex-1 resize-none bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base md:text-lg py-2 min-h-[24px] max-h-40"
              rows={1}
              disabled={isLoading}
            />
            
            <button
              type="submit"
              disabled={!(message.trim().length > 0 || (model === 'aluda2' && attachedImage)) || isLoading}
              className="ml-2 sm:ml-3 w-10 h-10 sm:w-12 sm:h-12 send-button bg-gradient-to-r from-blue-500 to-purple-600 dark:from-gray-700 dark:to-gray-500 text-white rounded-full hover:from-blue-600 hover:to-purple-700 dark:hover:from-gray-600 dark:hover:to-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105"
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
