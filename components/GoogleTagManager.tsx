'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export default function GoogleTagManager() {
  useEffect(() => {
    // Ensure dataLayer exists
    if (typeof window !== 'undefined') {
      (window as any).dataLayer = (window as any).dataLayer || []
    }
  }, [])

  return (
    <>
      {/* Google Tag Manager - Script in head */}
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MS32GDR6');`,
        }}
      />
    </>
  )
}

