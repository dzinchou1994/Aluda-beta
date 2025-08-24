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

    const ensureInputVisible = () => {
      try {
        const inputWrapper = document.getElementById('chat-input-wrapper')
        if (inputWrapper) {
          inputWrapper.scrollIntoView({ block: 'end', behavior: 'auto' })
        }
        const messagesContainer = document.querySelector('.messages-container-spacing') as HTMLElement | null
        if (messagesContainer) {
          messagesContainer.dataset.userScrolled = 'false'
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
      } catch {}
    }

    const updateFixedElementSpacing = () => {
      try {
        const header = document.getElementById('chat-header')
        const inputWrapper = document.getElementById('chat-input-wrapper')
        const messagesContainer = document.querySelector('.messages-container-spacing') as HTMLElement

        if (header && messagesContainer) {
          const headerRect = header.getBoundingClientRect()
          const headerHeight = headerRect.height

          // Calculate total visual height including bottom border
          const headerStyle = getComputedStyle(header)
          const headerBorderBottom = parseFloat(headerStyle.borderBottomWidth)
          const visualHeaderHeight = headerHeight + headerBorderBottom

          // Add safe area inset top for iOS devices
          const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0')

          // Reduced extra buffer and minimum
          const totalTopPadding = Math.max(visualHeaderHeight + safeAreaTop + 8, 56)

          document.documentElement.style.setProperty('--header-spacing', `${totalTopPadding}px`)
          document.documentElement.style.setProperty('--header-height', `${headerHeight}px`)

          // Do NOT set messagesContainer.style.paddingTop here to avoid double-spacing
        }

        if (inputWrapper && messagesContainer) {
          const inputRect = inputWrapper.getBoundingClientRect()
          const inputHeight = inputRect.height

          // Compute total visual height including borders/margins
          const inputStyle = getComputedStyle(inputWrapper)
          const inputBorderTop = parseFloat(inputStyle.borderTopWidth)
          const inputMarginTop = parseFloat(inputStyle.marginTop)
          const inputMarginBottom = parseFloat(inputStyle.marginBottom)
          const visualInputHeight = inputHeight + inputBorderTop + inputMarginTop + inputMarginBottom

          const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0')

          // Reduced buffer and minimum; do NOT include keyboard offset here
          const bottomWithoutKb = Math.max(visualInputHeight + safeAreaBottom + 8, 56)

          document.documentElement.style.setProperty('--input-spacing', `${bottomWithoutKb}px`)
          document.documentElement.style.setProperty('--input-area-height', `${inputHeight}px`)

          // Do NOT set messagesContainer.style.paddingBottom to avoid double-spacing
        }
      } catch (error) {
        // Swallow layout measurement issues silently in production
      }
    }

    const doUpdate = () => {
      const innerH = window.innerHeight || 0
      const vvH = visualViewport.height || innerH
      const vvTop = (visualViewport as any).offsetTop || 0
      const overlap = Math.max(0, Math.round(innerH - vvH - vvTop))

      // Apply kb-offset back only to input positioning; heavy layout recalcs are throttled elsewhere
      if (Math.abs(overlap - lastKbOffset) >= 3) {
        const openingKeyboard = overlap > lastKbOffset + 20 // trigger only on meaningful increase
        lastKbOffset = overlap
        document.documentElement.style.setProperty('--kb-offset', `${overlap}px`)

        if (openingKeyboard) {
          // Only force visibility when keyboard is opening
          requestAnimationFrame(() => ensureInputVisible())
          setTimeout(() => ensureInputVisible(), 80)
        }
      }

      if (overlap > 0) {
        document.body.classList.add('kb-open')
      } else {
        document.body.classList.remove('kb-open')
      }

      // Update spacing for fixed elements when viewport sizes meaningfully change
      if (Math.abs(innerH - lastInnerH) >= 4 || Math.abs(vvH - lastVvH) >= 4) {
        lastInnerH = innerH
        lastVvH = vvH
        updateFixedElementSpacing()
      }
    }

    const update = () => {
      // During active typing, defer updates briefly to prevent input blinking
      // But if the keyboard is opening (large overlap increase), update immediately
      const now = Date.now()
      try {
        const innerH = window.innerHeight || 0
        const vvH = visualViewport.height || innerH
        const vvTop = (visualViewport as any).offsetTop || 0
        const overlapNow = Math.max(0, Math.round(innerH - vvH - vvTop))
        const openingKeyboard = overlapNow - lastKbOffset >= 40
        if (!openingKeyboard && now - lastTypeTs < TYPING_LOCK_MS) {
          if (typingLockTimer) clearTimeout(typingLockTimer)
          typingLockTimer = window.setTimeout(() => {
            if (rafId) cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(() => doUpdate())
          }, TYPING_LOCK_MS)
          return
        }
      } catch {}
      if (rafId) cancelAnimationFrame(rafId)
      // Throttle with rAF to avoid rapid layout thrashing while typing
      rafId = requestAnimationFrame(() => doUpdate())
    }

    // Initial update with small delay to ensure DOM is ready
    setTimeout(() => {
      update()
    }, 100)

    // Additional update after a short delay to catch any late DOM changes
    setTimeout(() => {
      update()
    }, 300)

    // Add resize observer for header and input changes (do not early-return; keep listeners active)
    let ro: ResizeObserver | null = null
    const ResizeObserverCtor: any = (window as any).ResizeObserver
    if (ResizeObserverCtor) {
      ro = new ResizeObserverCtor(updateFixedElementSpacing)
      const header = document.getElementById('chat-header')
      const inputWrapper = document.getElementById('chat-input-wrapper')
      if (ro && header) ro.observe(header)
      if (ro && inputWrapper) ro.observe(inputWrapper)
    }

    // Viewport and orientation listeners
    visualViewport.addEventListener('resize', update)
    visualViewport.addEventListener('scroll', update)
    window.addEventListener('orientationchange', update)

    return () => {
      try {
        if (ro) {
          const header = document.getElementById('chat-header')
          const inputWrapper = document.getElementById('chat-input-wrapper')
          try { if (header) (ro as any).unobserve(header) } catch {}
          try { if (inputWrapper) (ro as any).unobserve(inputWrapper) } catch {}
          try { (ro as any).disconnect() } catch {}
        }
      } catch {}

      try {
        visualViewport.removeEventListener('resize', update)
        visualViewport.removeEventListener('scroll', update)
        window.removeEventListener('orientationchange', update)
        document.removeEventListener('keydown', handleType)
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


