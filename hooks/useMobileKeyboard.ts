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
          // Try to scroll the input into view
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

        // Fallback: scroll the window if needed
        setTimeout(() => {
          const inputElement = document.querySelector('textarea') as HTMLTextAreaElement | null
          if (inputElement) {
            const rect = inputElement.getBoundingClientRect()
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
            
            if (!isVisible) {
              // If input is not visible, scroll window to show it
              window.scrollTo({
                top: window.scrollY + rect.bottom - window.innerHeight + 100,
                behavior: 'smooth'
              })
            }
          }
        }, 200)
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


