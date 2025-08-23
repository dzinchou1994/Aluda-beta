'use client'

import { useEffect } from 'react'

/**
 * Handles mobile keyboard visibility and adjusts input positioning.
 * Also manages proper spacing for fixed header and input areas.
 */
export function useMobileKeyboard() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const visualViewport: VisualViewport | undefined = (window as any).visualViewport
    if (!visualViewport) return

    const update = () => {
      const innerH = window.innerHeight || 0
      const vvH = visualViewport.height || innerH
      const vvTop = (visualViewport as any).offsetTop || 0
      const overlap = Math.max(0, Math.round(innerH - vvH - vvTop))

      // Add keyboard offset
      document.documentElement.style.setProperty('--kb-offset', `${overlap}px`)

      if (overlap > 0) {
        document.body.classList.add('kb-open')
      } else {
        document.body.classList.remove('kb-open')
      }

      // Update spacing for fixed elements
      updateFixedElementSpacing()
    }

    const updateFixedElementSpacing = () => {
      try {
        const header = document.getElementById('chat-header')
        const inputWrapper = document.getElementById('chat-input-wrapper')
        const messagesContainer = document.querySelector('.messages-container-spacing') as HTMLElement

        if (header && messagesContainer) {
          const headerHeight = header.getBoundingClientRect().height
          // Add safe area inset top for iOS devices
          const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0')
          const totalTopPadding = headerHeight + safeAreaTop + 8 // 8px extra spacing
          document.documentElement.style.setProperty('--header-spacing', `${totalTopPadding}px`)
          messagesContainer.style.paddingTop = `${totalTopPadding}px`
        }

        if (inputWrapper && messagesContainer) {
          const inputHeight = inputWrapper.getBoundingClientRect().height
          // Add safe area inset bottom for iOS devices
          const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0')
          const keyboardOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--kb-offset') || '0')
          const totalBottomPadding = inputHeight + safeAreaBottom + keyboardOffset + 16 // 16px extra spacing
          document.documentElement.style.setProperty('--input-spacing', `${totalBottomPadding}px`)
          messagesContainer.style.paddingBottom = `${totalBottomPadding}px`
        }
      } catch (error) {
        console.warn('Error updating fixed element spacing:', error)
      }
    }

    // Initial update
    update()

    // Add resize observer for header and input changes
    const ResizeObserverCtor: any = (window as any).ResizeObserver
    if (ResizeObserverCtor) {
      const ro = new ResizeObserverCtor(updateFixedElementSpacing)

      const header = document.getElementById('chat-header')
      const inputWrapper = document.getElementById('chat-input-wrapper')

      if (header) ro.observe(header)
      if (inputWrapper) ro.observe(inputWrapper)

      // Cleanup function
      return () => {
        try {
          if (header) ro.unobserve(header)
          if (inputWrapper) ro.unobserve(inputWrapper)
          ro.disconnect()
        } catch {}

        visualViewport.removeEventListener('resize', update)
        visualViewport.removeEventListener('scroll', update)
        window.removeEventListener('orientationchange', update)
        document.documentElement.style.removeProperty('--kb-offset')
        document.documentElement.style.removeProperty('--header-spacing')
        document.documentElement.style.removeProperty('--input-spacing')
        document.body.classList.remove('kb-open')
      }
    }

    visualViewport.addEventListener('resize', update)
    visualViewport.addEventListener('scroll', update)
    window.addEventListener('orientationchange', update)

    return () => {
      try {
        visualViewport.removeEventListener('resize', update)
        visualViewport.removeEventListener('scroll', update)
        window.removeEventListener('orientationchange', update)
        document.documentElement.style.removeProperty('--kb-offset')
        document.documentElement.style.removeProperty('--header-spacing')
        document.documentElement.style.removeProperty('--input-spacing')
        document.body.classList.remove('kb-open')
      } catch {}
    }
  }, [])
}


