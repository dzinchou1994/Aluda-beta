'use client'

import { useEffect } from 'react'

/**
 * Simple mobile keyboard handling - just ensures input is visible when focused
 */
export function useMobileKeyboard() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const ensureInputVisible = () => {
      try {
        const inputWrapper = document.getElementById('chat-input-wrapper')
        if (inputWrapper) {
          // Use smooth scrolling to bring input into view
          inputWrapper.scrollIntoView({ 
            block: 'end', 
            behavior: 'smooth',
            inline: 'nearest'
          })
        }
        
        const messagesContainer = document.querySelector('.messages-container-spacing') as HTMLElement | null
        if (messagesContainer) {
          // Always scroll to bottom of messages container
          messagesContainer.dataset.userScrolled = 'false'
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
      } catch (error) {
        console.warn('Error ensuring input visibility:', error)
      }
    }

    // Listen for focus events on textarea elements
    const handleInputFocus = () => {
      setTimeout(() => {
        ensureInputVisible()
      }, 100)
    }

    document.addEventListener('focusin', (e) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        handleInputFocus()
      }
    }, { passive: true })

    return () => {
      try {
        document.removeEventListener('focusin', handleInputFocus)
      } catch {}
    }
  }, [])
}


