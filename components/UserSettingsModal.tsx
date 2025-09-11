"use client"

import { useEffect, useMemo, useState } from 'react'
import { useTokens } from '@/context/TokensContext'
import { Image, ChevronDown, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

interface Props {
  open: boolean
  onClose: () => void
  userEmail?: string | null
}

export default function UserSettingsModal({ open, onClose, userEmail }: Props) {
  const { usage, limits, actor, refresh } = useTokens()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)

  useEffect(() => {
    if (open) {
      setCurrentPassword('')
      setNewPassword('')
      setPassMsg('')
      setShowPasswordChange(false)
      refresh()
    }
  }, [open, refresh])

  if (!open) return null


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

  const dailyPercent = useMemo(() => limits.daily ? Math.min(100, Math.round((usage.daily / limits.daily) * 100)) : 0, [usage, limits])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-[92vw] max-w-lg p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">პარამეტრები</h2>

        <div className="space-y-6">
          {/* User Account Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">ანგარიშის ინფორმაცია</h3>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              {/* Email only */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">ელფოსტა</span>
                </div>
                <span className="text-sm text-gray-900 dark:text-white font-medium">
                  {userEmail || 'ელფოსტა არ არის მითითებული'}
                </span>
              </div>
            </div>
          </div>

          {/* Plan (separate card) */}
          <div>
            <h3 className="sr-only">გეგმა</h3>
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${actor?.plan === 'PREMIUM' ? 'bg-purple-500' : 'bg-gray-400'}`}></span>
                <div className="text-sm">
                  <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">გეგმა</div>
                  <div className="text-gray-900 dark:text-white font-medium">{actor?.plan === 'PREMIUM' ? 'პრემიუმ' : 'უფასო'}</div>
                </div>
              </div>
              {actor?.plan !== 'PREMIUM' && (
                <button
                  onClick={() => window.open('/buy', '_blank')}
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-md transition-all duration-200"
                >
                  გახდი პრემიუმ
                </button>
              )}
            </div>
          </div>

          {/* Tokens (daily-only) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">ტოკენები</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">დღიური ლიმიტი</span>
            </div>
            <div className="relative w-full h-3 rounded-full bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
              <div className={`absolute inset-y-0 left-0 ${dailyPercent >= 100 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600'} shadow-[0_0_8px_rgba(99,102,241,0.35)]`} style={{ width: `${dailyPercent}%` }} />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span className="tabular-nums">{usage.daily} / {limits.daily}</span>
              <span className={`tabular-nums px-1.5 py-0.5 rounded-md border ${dailyPercent >= 100 ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300' : 'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>{dailyPercent}%</span>
            </div>
          </div>

          {/* Generated Images */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Image className="w-4 h-4 text-purple-500" />
              გენერირებული სურათები
            </h3>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {usage.images || 0}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    / {limits.images || 0}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">თვიური ლიმიტი</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {actor?.plan === 'PREMIUM' ? 'Premium' : actor?.type === 'user' ? '' : 'Guest'}
                  </div>
                </div>
              </div>
              {/* Progress bar for images */}
              <div className="mt-3 relative w-full h-2 rounded-full bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 h-2 shadow-[0_0_8px_rgba(236,72,153,0.35)]" 
                  style={{ width: `${limits.images ? Math.min(100, Math.round((usage.images / limits.images) * 100)) : 0}%` }} 
                />
              </div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 text-center">
                {usage.images || 0} / {limits.images || 0} სურათი
              </div>
            </div>
          </div>


          {/* Password Change */}
          <div>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-input-bg hover:bg-gray-50 dark:hover:bg-user-bubble transition-all duration-200"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">პაროლის შეცვლა</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showPasswordChange ? 'rotate-180' : ''}`} />
            </button>
            
            {showPasswordChange && (
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
            )}
          </div>

          {/* Logout */}
          <div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">გამოსვლა</span>
            </button>
          </div>
        </div>

        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 dark:text-gray-300">✕</button>
      </div>
    </div>
  )
}



