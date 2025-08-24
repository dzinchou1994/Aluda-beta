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
          // Get the actual visual height including borders and any visual elements
          const headerRect = header.getBoundingClientRect()
          const headerHeight = headerRect.height

          // Add safe area inset top for iOS devices
          const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0')

          // Minimal spacing for tight layout
          const totalTopPadding = Math.max(headerHeight + safeAreaTop + 2, 45) // Very minimal spacing

          document.documentElement.style.setProperty('--header-spacing', `${totalTopPadding}px`)
          document.documentElement.style.setProperty('--header-height', `${headerHeight}px`)

          // For the new approach, we still need padding for proper spacing
          messagesContainer.style.paddingTop = `${totalTopPadding}px`
        }

        if (inputWrapper && messagesContainer) {
          const inputRect = inputWrapper.getBoundingClientRect()
          const inputHeight = inputRect.height

          // Add safe area inset bottom for iOS devices
          const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0')
          const keyboardOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--kb-offset') || '0')

          // Dynamic spacing that adapts to input height, but with limits to prevent blinking
          const baseSpacing = 45 // Base minimum spacing
          const maxInputHeight = Math.min(inputHeight, 200) // Cap at 200px to prevent excessive spacing
          const dynamicSpacing = Math.max(maxInputHeight + safeAreaBottom + keyboardOffset + 2, baseSpacing)

          document.documentElement.style.setProperty('--input-spacing', `${dynamicSpacing}px`)
          document.documentElement.style.setProperty('--input-area-height', `${inputHeight}px`)

          // For the new approach, we still need padding for proper spacing
          messagesContainer.style.paddingBottom = `${dynamicSpacing}px`
        }
      } catch (error) {
        console.warn('Error updating fixed element spacing:', error)
      }
    }

    // Initial update with small delay to ensure DOM is ready
    setTimeout(() => {
      update()
    }, 100)

    // Additional update after a short delay to catch any late DOM changes
    setTimeout(() => {
      update()
    }, 300)

    // Debounced function to prevent excessive updates during typing
    let updateTimeout: NodeJS.Timeout
    const debouncedUpdateFixedElementSpacing = () => {
      clearTimeout(updateTimeout)
      updateTimeout = setTimeout(updateFixedElementSpacing, 50) // 50ms debounce
    }

    // Add resize observer for header and input changes
    const ResizeObserverCtor: any = (window as any).ResizeObserver
    if (ResizeObserverCtor) {
      const ro = new ResizeObserverCtor(debouncedUpdateFixedElementSpacing)

      const header = document.getElementById('chat-header')
      const inputWrapper = document.getElementById('chat-input-wrapper')

      if (header) ro.observe(header)
      if (inputWrapper) ro.observe(inputWrapper)

      // Cleanup function
      return () => {
        try {
          clearTimeout(updateTimeout)
          if (header) ro.unobserve(header)
          if (inputWrapper) ro.unobserve(inputWrapper)
          ro.disconnect()
        } catch {}

        visualViewport.removeEventListener('resize', update)
        visualViewport.removeEventListener('scroll', update)
        window.removeEventListener('orientationchange', update)
        document.documentElement.style.removeProperty('--kb-offset')
        document.documentElement.style.removeProperty('--header-spacing')
        document.documentElement.style.removeProperty('--header-height')
        document.documentElement.style.removeProperty('--input-spacing')
        document.documentElement.style.removeProperty('--input-area-height')
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
        document.documentElement.style.removeProperty('--header-height')
        document.documentElement.style.removeProperty('--input-spacing')
        document.documentElement.style.removeProperty('--input-area-height')
        document.body.classList.remove('kb-open')
      } catch {}
    }
  }, [])
}


