import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [totalUsers, premiumUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: 'PREMIUM' } })
  ])

  // Online users (approx): active sessions not expired
  const now = new Date()
  const online = await prisma.session.count({ where: { expires: { gt: now } } })

  // 24h token activity
  const dayKey = new Date().toISOString().slice(0,10)
  const lastDayUsage = await prisma.tokenUsage.aggregate({
    _sum: { tokens: true },
    where: { period: 'day', periodKey: dayKey }
  })

  return NextResponse.json({
    totalUsers,
    premiumUsers,
    freeUsers: totalUsers - premiumUsers,
    onlineUsers: online,
    tokensToday: lastDayUsage._sum.tokens || 0,
  })
}


