'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send, Copy, Check } from 'lucide-react';

interface FeedbackButtonsProps {
  messageId: string;
  chatflowId: string;
  chatId: string;
  messageContent: string;
  onFeedbackSent?: () => void;
}

export default function FeedbackButtons({ messageId, chatflowId, chatId, messageContent, onFeedbackSent }: FeedbackButtonsProps) {
  const [rating, setRating] = useState<'THUMBS_UP' | 'THUMBS_DOWN' | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleRatingClick = (newRating: 'THUMBS_UP' | 'THUMBS_DOWN') => {
    if (isSubmitted) return;
    
    setRating(newRating);
    setShowCommentInput(true);
  };

  const handleSubmitFeedback = async () => {
    if (!rating || isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          chatflowId,
          chatId,
          rating,
          content: comment.trim(),
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        onFeedbackSent?.();
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitFeedback();
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center gap-2 mt-3 text-sm text-gray-500 dark:text-gray-400">
        <span>მადლობა თქვენი გამოხმაურებისთვის!</span>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {/* Rating and Copy Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleRatingClick('THUMBS_UP')}
          className={`p-1 rounded-full transition-colors ${
            rating === 'THUMBS_UP'
              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
          disabled={isSubmitting}
        >
          <ThumbsUp size={12} />
        </button>
        <button
          onClick={() => handleRatingClick('THUMBS_DOWN')}
          className={`p-1 rounded-full transition-colors ${
            rating === 'THUMBS_DOWN'
              ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
          disabled={isSubmitting}
        >
          <ThumbsDown size={12} />
        </button>
        <button
          onClick={handleCopyMessage}
          className={`p-1 rounded-full transition-colors ${
            isCopied
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
          title={isCopied ? 'კოპირებულია!' : 'კოპირება'}
        >
          {isCopied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>

      {/* Comment Input */}
      {showCommentInput && (
        <div className="mt-3 space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={rating === 'THUMBS_UP' ? 'რა მოგეწონათ?' : 'რა შეიძლება გაუმჯობესდეს?'}
            className="w-full p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            rows={2}
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowCommentInput(false);
                setRating(null);
                setComment('');
              }}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={isSubmitting}
            >
              გაუქმება
            </button>
            <button
              onClick={handleSubmitFeedback}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
              გაგზავნა
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
