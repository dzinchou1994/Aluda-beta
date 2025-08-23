'use client'

import { useEffect } from 'react'

/**
 * Handles mobile keyboard visibility and adjusts input positioning.
 * Simplified version that works with fixed positioning layout.
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

      // Add keyboard offset to body for potential use
      document.documentElement.style.setProperty('--kb-offset', `${overlap}px`)

      if (overlap > 0) {
        document.body.classList.add('kb-open')
        // Add extra padding to prevent content from being hidden behind keyboard
        document.body.style.paddingBottom = `${overlap}px`
      } else {
        document.body.classList.remove('kb-open')
        document.body.style.paddingBottom = '0px'
      }
    }

    update()
    visualViewport.addEventListener('resize', update)
    visualViewport.addEventListener('scroll', update)
    window.addEventListener('orientationchange', update)

    return () => {
      try {
        visualViewport.removeEventListener('resize', update)
        visualViewport.removeEventListener('scroll', update)
        window.removeEventListener('orientationchange', update)
        document.documentElement.style.removeProperty('--kb-offset')
        document.body.classList.remove('kb-open')
        document.body.style.paddingBottom = '0px'
      } catch {}
    }
  }, [])
}


