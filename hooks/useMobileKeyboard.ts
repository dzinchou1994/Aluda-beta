'use client'

import { useEffect } from 'react'

/**
 * Updates CSS var --kb-offset with the on-screen keyboard overlap on mobile.
 * Adds body.kb-open when keyboard is visible; removes when hidden.
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
      document.documentElement.style.setProperty('--kb-offset', `${overlap}px`)
      // Measure header and input heights to drive paddings precisely
      try {
        const header = document.getElementById('chat-header')
        if (header) {
          const topbarHeight = Math.round(header.getBoundingClientRect().height)
          document.documentElement.style.setProperty('--topbar-height', `${topbarHeight}px`)
        }
        const input = document.querySelector('#chat-input-wrapper') as HTMLElement | null
        if (input) {
          const inputHeight = Math.round(input.getBoundingClientRect().height)
          document.documentElement.style.setProperty('--input-area-height', `${inputHeight}px`)
        }
      } catch {}
      if (overlap > 0) document.body.classList.add('kb-open')
      else document.body.classList.remove('kb-open')
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
      } catch {}
    }
  }, [])
}


