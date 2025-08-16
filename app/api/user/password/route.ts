import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { currentPassword, newPassword } = await req.json()
    if (!currentPassword || !newPassword) return NextResponse.json({ error: 'ველი ხარვეზია' }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.password) return NextResponse.json({ error: 'პაროლი მიგნებული არ არის' }, { status: 400 })
    const ok = await bcrypt.compare(currentPassword, user.password)
    if (!ok) return NextResponse.json({ error: 'მიმდინარე პაროლი არასწორია' }, { status: 400 })
    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'სერვერის შეცდომა' }, { status: 500 })
  }
}





