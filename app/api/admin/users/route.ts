import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      plan: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  // Fetch last token activity per user (latest TokenUsage)
  const usage = await prisma.tokenUsage.groupBy({
    by: ['actorId'],
    _max: { updatedAt: true, tokens: true },
    where: { actorType: 'user' },
  })
  const actorIdToLastActivity: Record<string, string | null> = {}
  for (const u of usage) {
    actorIdToLastActivity[u.actorId] = u._max.updatedAt?.toISOString() || null
  }

  const data = users.map(u => ({
    ...u,
    lastActivityAt: actorIdToLastActivity[u.id] || null,
  }))

  return NextResponse.json({ count: data.length, users: data })
}


