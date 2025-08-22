"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function BuyReturnPage() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const status = (params.get('status') || '').toLowerCase()
    if (status === 'success' || status === 'paid' || status === 'approved') {
      router.replace('/chat')
    }
  }, [params, router])

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="text-gray-700 dark:text-gray-200">მიმდინარეობს გადამისამართება…</div>
    </div>
  )
}


