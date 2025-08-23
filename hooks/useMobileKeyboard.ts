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
    // Run a few frames after mount to capture late layout/Font loads
    let raf = 0
    for (let i = 0; i < 5; i++) raf = requestAnimationFrame(update)
    visualViewport.addEventListener('resize', update)
    visualViewport.addEventListener('scroll', update)
    // Update on page/container scroll (URL bar collapse/expand)
    window.addEventListener('scroll', update, true)
    // Observe header/input size changes
    const ResizeObserverCtor: any = (window as any).ResizeObserver
    const ro = ResizeObserverCtor ? new ResizeObserverCtor(() => update()) : null
    try {
      const header = document.getElementById('chat-header')
      if (header && ro) ro.observe(header)
      const input = document.querySelector('#chat-input-wrapper') as HTMLElement | null
      if (input && ro) ro.observe(input)
    } catch {}
    window.addEventListener('orientationchange', update)

    return () => {
      try {
        if (raf) cancelAnimationFrame(raf)
        visualViewport.removeEventListener('resize', update)
        visualViewport.removeEventListener('scroll', update)
        window.removeEventListener('scroll', update, true)
        window.removeEventListener('orientationchange', update)
        try {
          const header = document.getElementById('chat-header')
          const input = document.querySelector('#chat-input-wrapper') as HTMLElement | null
          if ((window as any).ResizeObserver && ro) {
            if (header) ro.unobserve(header)
            if (input) ro.unobserve(input)
            ro.disconnect()
          }
        } catch {}
        document.documentElement.style.removeProperty('--kb-offset')
        document.body.classList.remove('kb-open')
      } catch {}
    }
  }, [])
}


