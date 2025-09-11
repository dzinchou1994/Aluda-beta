"use client"

import { useEffect, useMemo, useState } from 'react'

type User = {
  id: string
  email: string | null
  plan: 'USER' | 'PREMIUM'
  createdAt: string
  updatedAt: string
  lastActivityAt: string | null
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PREMIUM' | 'USER'>('ALL')
  const [stats, setStats] = useState<{totalUsers:number;premiumUsers:number;freeUsers:number;onlineUsers:number;tokensToday:number} | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/users', { cache: 'no-store' })
        if (!res.ok) throw new Error('Forbidden or failed to load')
        const data = await res.json()
        setUsers(data.users || [])
        const s = await fetch('/api/admin/stats', { cache: 'no-store' })
        if (s.ok) setStats(await s.json())
      } catch (e) {
        // noop
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'ALL') return users
    return users.filter(u => u.plan === filter)
  }, [users, filter])

  if (loading) {
    return <div className="p-6">Loading…</div>
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Users" value={stats.totalUsers} />
          <StatCard label="Premium" value={stats.premiumUsers} accent="purple" />
          <StatCard label="Free" value={stats.freeUsers} accent="blue" />
          <StatCard label="Online" value={stats.onlineUsers} accent="green" />
          <StatCard label="Tokens today" value={stats.tokensToday} accent="indigo" />
        </div>
      )}
      <div className="flex items-center gap-3 text-sm">
        <button className={`px-3 py-1 rounded-md border ${filter==='ALL'?'bg-gray-900 text-white':'bg-white dark:bg-gray-800'}`} onClick={()=>setFilter('ALL')}>All ({users.length})</button>
        <button className={`px-3 py-1 rounded-md border ${filter==='PREMIUM'?'bg-purple-600 text-white':'bg-white dark:bg-gray-800'}`} onClick={()=>setFilter('PREMIUM')}>Premium ({users.filter(u=>u.plan==='PREMIUM').length})</button>
        <button className={`px-3 py-1 rounded-md border ${filter==='USER'?'bg-blue-600 text-white':'bg-white dark:bg-gray-800'}`} onClick={()=>setFilter('USER')}>Free ({users.filter(u=>u.plan==='USER').length})</button>
      </div>

      <div className="overflow-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Plan</th>
              <th className="text-left px-3 py-2">Created</th>
              <th className="text-left px-3 py-2">Updated</th>
              <th className="text-left px-3 py-2">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800">
                <td className="px-3 py-2">{u.email || u.id}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${u.plan==='PREMIUM'?'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300':'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>{u.plan}</span>
                </td>
                <td className="px-3 py-2 tabular-nums">{new Date(u.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2 tabular-nums">{new Date(u.updatedAt).toLocaleString()}</td>
                <td className="px-3 py-2 tabular-nums">{u.lastActivityAt ? new Date(u.lastActivityAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: 'purple'|'blue'|'green'|'indigo' }) {
  const color = accent === 'purple' ? 'from-purple-500 to-pink-500'
    : accent === 'blue' ? 'from-blue-500 to-cyan-500'
    : accent === 'green' ? 'from-emerald-500 to-lime-500'
    : accent === 'indigo' ? 'from-indigo-500 to-violet-500'
    : 'from-gray-600 to-gray-800'
  return (
    <div className="rounded-xl border p-3 bg-white dark:bg-gray-900">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className={`mt-2 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden`}>
        <div className={`h-1.5 w-1/2 bg-gradient-to-r ${color}`} />
      </div>
    </div>
  )
}


