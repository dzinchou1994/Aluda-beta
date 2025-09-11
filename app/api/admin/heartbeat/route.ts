import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensurePresenceSchema } from '@/lib/presence'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const email = session?.user?.email || null
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 })

  await ensurePresenceSchema()
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Presence" ("id","userId","email","lastSeen")
      VALUES (gen_random_uuid()::text, $1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT ("userId") DO UPDATE SET
        "email" = EXCLUDED."email",
        "lastSeen" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP
    `, userId, email)
  } catch {
    await (prisma as any).presence.upsert({
      where: { userId },
      update: { lastSeen: new Date(), email: email || undefined },
      create: { userId, email: email || undefined },
    })
  }

  return NextResponse.json({ ok: true })
}


