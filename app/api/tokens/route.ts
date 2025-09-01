import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrCreateSession } from '@/lib/session'
import { canConsume } from '@/lib/tokens'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  const cookieSess = getOrCreateSession()

  let actor
  if (session?.user?.id) {
    // Get actual user plan from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true }
    })

    actor = {
      type: 'user' as const,
      id: session.user.id,
      plan: user?.plan === 'PREMIUM' ? ('PREMIUM' as const) : ('USER' as const)
    }
  } else {
    actor = {
      type: 'guest' as const,
      id: cookieSess.guestId || cookieSess.sessionId
    }
  }

  // zero tokens to just fetch usage/limits
  const { usage, limits } = await canConsume(actor, 0)
  return NextResponse.json({ actor, usage, limits })
}


