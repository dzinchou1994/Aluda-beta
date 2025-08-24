'use client'

import { useEffect } from 'react'

/**
 * Simple mobile keyboard handling - just ensures input is visible when focused
 */
export function useMobileKeyboard() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    const body = document.body

    // Keep previous inline styles to restore later
    let prevRootOverflow = ''
    let prevBodyOverflow = ''
    let prevRootHeight = ''
    let prevBodyHeight = ''
    let pageScrollTemporarilyEnabled = false

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

    const temporarilyEnablePageScroll = () => {
      if (pageScrollTemporarilyEnabled) return
      pageScrollTemporarilyEnabled = true
      // Save current inline styles
      prevRootOverflow = root.style.overflow
      prevBodyOverflow = body.style.overflow
      prevRootHeight = root.style.height
      prevBodyHeight = body.style.height
      // Allow page to scroll even if CSS sets overflow hidden on mobile
      root.style.overflow = 'auto'
      body.style.overflow = 'auto'
      root.style.height = 'auto'
      body.style.height = 'auto'
    }

    const restorePageScroll = () => {
      if (!pageScrollTemporarilyEnabled) return
      pageScrollTemporarilyEnabled = false
      root.style.overflow = prevRootOverflow
      body.style.overflow = prevBodyOverflow
      root.style.height = prevRootHeight
      body.style.height = prevBodyHeight
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

        // Also nudge the whole page to bottom for the first-focus case on iOS
        const scrollToBottom = () => {
          const scrollingEl = document.scrollingElement || document.documentElement
          try {
            scrollingEl.scrollTo({ top: scrollingEl.scrollHeight, behavior: 'smooth' })
          } catch {
            // Fallback without smooth
            scrollingEl.scrollTop = scrollingEl.scrollHeight
            window.scrollTo(0, document.body.scrollHeight)
          }
        }
        requestAnimationFrame(scrollToBottom)
        setTimeout(scrollToBottom, 80)
        setTimeout(scrollToBottom, 180)
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
          // Allow page scrolling for the first-focus scenario
          temporarilyEnablePageScroll()
        }
        setTimeout(ensureInputVisible, 100)
      }
    }

    const onFocusOut = () => {
      // Restore scroll shortly after focus leaves inputs
      setTimeout(() => {
        const ae = document.activeElement
        if (!(ae instanceof HTMLInputElement) && !(ae instanceof HTMLTextAreaElement)) {
          restorePageScroll()
        }
      }, 200)
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
        if (keyboardLikelyOpen) {
          temporarilyEnablePageScroll()
          setTimeout(ensureInputVisible, 50)
        } else {
          // Keyboard closing, restore original page scroll restrictions
          restorePageScroll()
        }
      } catch {}
    }

    // Initial measurements
    updateLayoutVars()

    // Event listeners
    document.addEventListener('focusin', onFocusIn, { passive: true })
    document.addEventListener('focusout', onFocusOut, { passive: true })
    document.addEventListener('input', onInput, { passive: true })
    window.addEventListener('orientationchange', onViewportChange)
    window.addEventListener('resize', onViewportChange)
    ;(window as any).visualViewport?.addEventListener('resize', onViewportChange)

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('input', onInput)
      window.removeEventListener('orientationchange', onViewportChange)
      window.removeEventListener('resize', onViewportChange)
      ;(window as any).visualViewport?.removeEventListener('resize', onViewportChange)
      restorePageScroll()
    }
  }, [])
}


