"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const params = useSearchParams()
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: pwd })
      })
      if (!res.ok) throw new Error('Invalid password')
      const cb = params.get('callbackUrl') || '/admin'
      router.replace(cb)
    } catch (e: any) {
      setErr(e.message || 'Error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 p-6 rounded-xl border bg-white dark:bg-gray-900">
        <h1 className="text-lg font-semibold">Admin verification</h1>
        <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} placeholder="Admin password" className="w-full px-3 py-2 rounded-md border bg-transparent" />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button type="submit" className="w-full px-3 py-2 rounded-md bg-gray-900 text-white">Continue</button>
      </form>
    </div>
  )
}


