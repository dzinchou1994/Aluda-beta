'use client';

import { useEffect } from 'react';

export default function InvoiceGeneratorPage() {
  useEffect(() => {
    // Load the Invoice generator in an iframe
    const iframe = document.createElement('iframe');
    iframe.src = '/aludadocs/index.html#invoice';
    iframe.style.cssText = `
      width: 100%;
      height: 100vh;
      border: none;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      background: white;
    `;
    
    document.body.appendChild(iframe);
    
    // Cleanup on unmount
    return () => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600">ინვოისის გენერატორი იტვირთება...</p>
        </div>
      </div>
    </div>
  );
}
