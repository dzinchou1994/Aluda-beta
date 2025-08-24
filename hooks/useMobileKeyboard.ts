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

    let rafId: number | null = null
    let lastKbOffset = 0
    let lastInnerH = 0
    let lastVvH = 0
    let lastTypeTs = 0
    let typingLockTimer: number | null = null
    const TYPING_LOCK_MS = 160

    const handleType = () => {
      lastTypeTs = Date.now()
    }
    document.addEventListener('keydown', handleType, { passive: true })

    const update = () => {
      // During active typing, defer updates briefly to prevent input blinking
      const now = Date.now()
      if (now - lastTypeTs < TYPING_LOCK_MS) {
        if (typingLockTimer) clearTimeout(typingLockTimer)
        typingLockTimer = window.setTimeout(() => {
          if (rafId) cancelAnimationFrame(rafId)
          rafId = requestAnimationFrame(() => doUpdate())
        }, TYPING_LOCK_MS)
        return
      }
      if (rafId) cancelAnimationFrame(rafId)
      // Throttle with rAF to avoid rapid layout thrashing while typing
      rafId = requestAnimationFrame(() => doUpdate())
    }

    const doUpdate = () => {
      const innerH = window.innerHeight || 0
      const vvH = visualViewport.height || innerH
      const vvTop = (visualViewport as any).offsetTop || 0
      const overlap = Math.max(0, Math.round(innerH - vvH - vvTop))

      // Apply kb-offset back only to input positioning; heavy layout recalcs are throttled elsewhere
      if (Math.abs(overlap - lastKbOffset) >= 3) {
        lastKbOffset = overlap
        document.documentElement.style.setProperty('--kb-offset', `${overlap}px`)
      }

      if (overlap > 0) {
        document.body.classList.add('kb-open')
      } else {
        document.body.classList.remove('kb-open')
      }

      // Update spacing for fixed elements
      // Update spacing only when viewport sizes meaningfully change (throttled by typing lock in caller)
      if (Math.abs(innerH - lastInnerH) >= 4 || Math.abs(vvH - lastVvH) >= 4) {
        lastInnerH = innerH
        lastVvH = vvH
        updateFixedElementSpacing()
      }
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

          // Get computed style to account for all visual elements
          const headerStyle = getComputedStyle(header)
          const headerPaddingTop = parseFloat(headerStyle.paddingTop)
          const headerPaddingBottom = parseFloat(headerStyle.paddingBottom)
          const headerBorderTop = parseFloat(headerStyle.borderTopWidth)
          const headerBorderBottom = parseFloat(headerStyle.borderBottomWidth)

          // Calculate total visual height including all elements
          const visualHeaderHeight = headerHeight + headerBorderBottom // Add bottom border

          // Add safe area inset top for iOS devices
          const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0')

          // Add generous extra spacing to ensure no overlap
          const totalTopPadding = Math.max(visualHeaderHeight + safeAreaTop + 20, 80) // Minimum 80px

          console.log('Header measurement:', {
            headerHeight,
            visualHeaderHeight,
            paddingTop: headerPaddingTop,
            paddingBottom: headerPaddingBottom,
            borderTop: headerBorderTop,
            borderBottom: headerBorderBottom,
            safeAreaTop,
            totalTopPadding
          })

          document.documentElement.style.setProperty('--header-spacing', `${totalTopPadding}px`)
          document.documentElement.style.setProperty('--header-height', `${headerHeight}px`)

          // For the new approach, we still need padding for proper spacing
          messagesContainer.style.paddingTop = `${totalTopPadding}px`
        }

        if (inputWrapper && messagesContainer) {
          const inputRect = inputWrapper.getBoundingClientRect()
          const inputHeight = inputRect.height

          // Get computed style to account for all visual elements
          const inputStyle = getComputedStyle(inputWrapper)
          const inputPaddingTop = parseFloat(inputStyle.paddingTop)
          const inputPaddingBottom = parseFloat(inputStyle.paddingBottom)
          const inputBorderTop = parseFloat(inputStyle.borderTopWidth)
          const inputBorderBottom = parseFloat(inputStyle.borderBottomWidth)
          const inputMarginTop = parseFloat(inputStyle.marginTop)
          const inputMarginBottom = parseFloat(inputStyle.marginBottom)

          // Calculate total visual height including all elements
          const visualInputHeight = inputHeight + inputBorderTop + inputMarginTop + inputMarginBottom

          // Add safe area inset bottom for iOS devices
          const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0')
          const keyboardOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--kb-offset') || '0')

          // Add generous extra spacing to ensure no overlap
          const totalBottomPadding = Math.max(visualInputHeight + safeAreaBottom + keyboardOffset + 32, 100) // Minimum 100px

          console.log('Input measurement:', {
            inputHeight,
            visualInputHeight,
            paddingTop: inputPaddingTop,
            paddingBottom: inputPaddingBottom,
            borderTop: inputBorderTop,
            borderBottom: inputBorderBottom,
            marginTop: inputMarginTop,
            marginBottom: inputMarginBottom,
            safeAreaBottom,
            keyboardOffset,
            totalBottomPadding
          })

          document.documentElement.style.setProperty('--input-spacing', `${totalBottomPadding}px`)
          document.documentElement.style.setProperty('--input-area-height', `${inputHeight}px`)

          // For the new approach, we still need padding for proper spacing
          // Do NOT include keyboard offset in padding; the input is already repositioned with --kb-offset.
          // Including it here causes the content to jump and reveal a large gray area while typing.
          const bottomWithoutKb = Math.max(visualInputHeight + safeAreaBottom + 32, 100)
          messagesContainer.style.paddingBottom = `${bottomWithoutKb}px`
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
        document.removeEventListener('keydown', handleType)
        // No kb-offset used anymore
        document.documentElement.style.removeProperty('--header-spacing')
        document.documentElement.style.removeProperty('--header-height')
        document.documentElement.style.removeProperty('--input-spacing')
        document.documentElement.style.removeProperty('--input-area-height')
        document.body.classList.remove('kb-open')
        if (rafId) cancelAnimationFrame(rafId)
        if (typingLockTimer) clearTimeout(typingLockTimer)
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
        document.removeEventListener('keydown', handleType)
        // No kb-offset used anymore
        document.documentElement.style.removeProperty('--header-spacing')
        document.documentElement.style.removeProperty('--header-height')
        document.documentElement.style.removeProperty('--input-spacing')
        document.documentElement.style.removeProperty('--input-area-height')
        document.body.classList.remove('kb-open')
        if (rafId) cancelAnimationFrame(rafId)
        if (typingLockTimer) clearTimeout(typingLockTimer)
      } catch {}
    }
  }, [])
}


