import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'ელფოსტა საჭიროა' }, { status: 400 })
    await prisma.user.update({ where: { id: session.user.id }, data: { email } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'სერვერის შეცდომა' }, { status: 500 })
  }
}






