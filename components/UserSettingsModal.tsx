"use client"

import { useEffect, useMemo, useState } from 'react'
import { useTokens } from '@/context/TokensContext'

interface Props {
  open: boolean
  onClose: () => void
  userEmail?: string | null
}

export default function UserSettingsModal({ open, onClose, userEmail }: Props) {
  const { usage, limits, refresh } = useTokens()
  const [email, setEmail] = useState(userEmail || '')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [passLoading, setPassLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail(userEmail || '')
      setEmailMsg('')
      setCurrentPassword('')
      setNewPassword('')
      setPassMsg('')
      refresh()
    }
  }, [open, userEmail, refresh])

  if (!open) return null

  const handleEmailSave = async () => {
    setEmailMsg('')
    setEmailLoading(true)
    try {
      const res = await fetch('/api/user/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'ვერ განახლდა ელფოსტა')
      setEmailMsg('ელფოსტა განახლდა')
    } catch (e: any) {
      setEmailMsg(e.message || 'შეცდომა')
    } finally {
      setEmailLoading(false)
    }
  }

  const handlePasswordSave = async () => {
    setPassMsg('')
    setPassLoading(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'ვერ განახლდა პაროლი')
      setPassMsg('პაროლი განახლდა')
      setCurrentPassword('')
      setNewPassword('')
    } catch (e: any) {
      setPassMsg(e.message || 'შეცდომა')
    } finally {
      setPassLoading(false)
    }
  }

  const monthlyPercent = useMemo(() => limits.monthly ? Math.min(100, Math.round((usage.monthly / limits.monthly) * 100)) : 0, [usage, limits])
  const dailyPercent = useMemo(() => limits.daily ? Math.min(100, Math.round((usage.daily / limits.daily) * 100)) : 0, [usage, limits])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-[92vw] max-w-lg p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">პარამეტრები</h2>

        <div className="space-y-6">
          {/* User Plan */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">მომხმარებლის გეგმა</h3>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${actor?.plan === 'PREMIUM' ? 'bg-yellow-400' : 'bg-gray-400'}`}></span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {actor?.plan === 'PREMIUM' ? 'პრემიუმ' : 'უფასო'}
                </span>
              </div>
              {actor?.plan !== 'PREMIUM' && (
                <button
                  onClick={() => window.open('/buy', '_blank')}
                  className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-xs rounded-lg transition-colors duration-200"
                >
                  გახდი პრემიუმ
                </button>
              )}
            </div>
          </div>

          {/* Tokens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">ტოკენები</h3>
              <span className="text-xs text-gray-500">თვიური ლიმიტი</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3" style={{ width: `${monthlyPercent}%` }} />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{usage.monthly} / {limits.monthly}</span>
              <span>{monthlyPercent}%</span>
            </div>

            <div className="mt-4 flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">დღიური ლიმიტი</span>
              <span className="text-xs text-gray-500">{dailyPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className={`${dailyPercent >= 100 ? 'bg-red-500' : 'bg-blue-400'} h-2`}
                style={{ width: `${dailyPercent}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{usage.daily} / {limits.daily}</div>
          </div>

          {/* Email */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ელფოსტის შეცვლა</h3>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white"
              placeholder="ახალი ელფოსტა"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleEmailSave}
                disabled={emailLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg disabled:opacity-50"
              >შენახვა</button>
            </div>
            {emailMsg && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{emailMsg}</p>}
          </div>

          {/* Password */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">პაროლის შეცვლა</h3>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white mb-2"
              placeholder="მიმდინარე პაროლი"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white"
              placeholder="ახალი პაროლი"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handlePasswordSave}
                disabled={passLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg disabled:opacity-50"
              >შენახვა</button>
            </div>
            {passMsg && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{passMsg}</p>}
          </div>
        </div>

        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 dark:text-gray-300">✕</button>
      </div>
    </div>
  )
}


