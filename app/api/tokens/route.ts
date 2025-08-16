import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrCreateSession } from '@/lib/session'
import { canConsume } from '@/lib/tokens'

export async function GET() {
  const session = await getServerSession(authOptions)
  const cookieSess = getOrCreateSession()
  const actor = session?.user?.id
    ? { type: 'user' as const, id: session.user.id, plan: 'USER' as const }
    : { type: 'guest' as const, id: cookieSess.guestId || cookieSess.sessionId }

  // zero tokens to just fetch usage/limits
  const { usage, limits } = await canConsume(actor, 0)
  return NextResponse.json({ actor, usage, limits })
}


