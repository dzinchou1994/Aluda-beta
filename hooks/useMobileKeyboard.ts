'use client'

import { useEffect } from 'react'

/**
 * Simple mobile keyboard handling - just ensures input is visible when focused
 */
export function useMobileKeyboard() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement

    const updateLayoutVars = () => {
      try {
        const inputWrapper = document.getElementById('chat-input-wrapper')
        const header = document.getElementById('chat-header')
        const inputHeight = inputWrapper?.getBoundingClientRect().height ?? 88
        const headerHeight = header?.getBoundingClientRect().height ?? 72
        root.style.setProperty('--input-spacing', `${Math.round(inputHeight)}px`)
        root.style.setProperty('--header-spacing', `${Math.round(headerHeight)}px`)
      } catch {}
    }

    const ensureInputVisible = () => {
      try {
        updateLayoutVars()

        const inputWrapper = document.getElementById('chat-input-wrapper')
        if (inputWrapper) {
          inputWrapper.scrollIntoView({ block: 'end', behavior: 'smooth', inline: 'nearest' })
        }

        const messagesContainer = document.querySelector('.messages-container-spacing') as HTMLElement | null
        if (messagesContainer) {
          messagesContainer.dataset.userScrolled = 'false'
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
      } catch (error) {
        console.warn('Error ensuring input visibility:', error)
      }
    }

    const onFocusIn = (e: Event) => {
      const t = e.target as Element | null
      if (t && (t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement)) {
        // Mark keyboard open state on focus for mobile
        if (window.innerWidth <= 768) {
          document.body.classList.add('kb-open')
        }
        setTimeout(ensureInputVisible, 100)
      }
    }

    const onInput = () => {
      // While typing, keep the messages container pinned to bottom on mobile
      if (window.innerWidth > 768) return
      const messagesContainer = document.querySelector('.messages-container-spacing') as HTMLElement | null
      if (messagesContainer) {
        messagesContainer.dataset.userScrolled = 'false'
        messagesContainer.scrollTop = messagesContainer.scrollHeight
      }
    }

    const onViewportChange = () => {
      // Detect virtual keyboard by visual viewport height changes
      try {
        const vv = (window as any).visualViewport as VisualViewport | undefined
        const keyboardLikelyOpen = !!vv && Math.abs(window.innerHeight - vv.height) > 60
        document.body.classList.toggle('kb-open', keyboardLikelyOpen)
        updateLayoutVars()
        // Nudge scroll to bottom when viewport changes to keep input visible
        setTimeout(ensureInputVisible, 50)
      } catch {}
    }

    // Initial measurements
    updateLayoutVars()

    // Event listeners
    document.addEventListener('focusin', onFocusIn, { passive: true })
    document.addEventListener('input', onInput, { passive: true })
    window.addEventListener('orientationchange', onViewportChange)
    window.addEventListener('resize', onViewportChange)
    ;(window as any).visualViewport?.addEventListener('resize', onViewportChange)

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('input', onInput)
      window.removeEventListener('orientationchange', onViewportChange)
      window.removeEventListener('resize', onViewportChange)
      ;(window as any).visualViewport?.removeEventListener('resize', onViewportChange)
    }
  }, [])
}


