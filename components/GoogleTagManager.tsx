'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function GoogleTagManager() {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize dataLayer immediately
    if (typeof window !== 'undefined') {
      (window as any).dataLayer = (window as any).dataLayer || []
      
      // Inject GTM script into head as early as possible
      if (!document.getElementById('google-tag-manager')) {
        const script = document.createElement('script')
        script.id = 'google-tag-manager'
        script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MS32GDR6');`
        // Insert at the very beginning of head
        document.head.insertBefore(script, document.head.firstChild)
      }
    }
  }, [])

  // Track page views on route changes (client-side navigation)
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname && (window as any).dataLayer) {
      // Push page view event for client-side navigation
      (window as any).dataLayer.push({
        event: 'page_view',
        page_path: pathname,
        page_location: window.location.href,
      })
    }
  }, [pathname])

  return null
}

