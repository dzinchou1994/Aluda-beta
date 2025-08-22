import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// One-time seed endpoint: only works if no existing BOG settings
export async function POST(request: NextRequest) {
  try {
    const count = await prisma.setting.count({ where: { key: { in: ['BOG_PUBLIC_KEY','BOG_SECRET_KEY','BOG_API_BASE','BOG_RETURN_URL','BOG_CALLBACK_URL'] } } })
    if (count > 0) {
      return NextResponse.json({ error: 'Settings already exist' }, { status: 409 })
    }

    const body = await request.json().catch(() => ({} as any))
    const required = ['BOG_PUBLIC_KEY','BOG_SECRET_KEY','BOG_RETURN_URL','BOG_CALLBACK_URL']
    const missing = required.filter(k => !body?.[k])
    if (missing.length) return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 })

    const items = [
      { key: 'BOG_PUBLIC_KEY', value: String(body.BOG_PUBLIC_KEY) },
      { key: 'BOG_SECRET_KEY', value: String(body.BOG_SECRET_KEY) },
      { key: 'BOG_API_BASE', value: String(body.BOG_API_BASE || 'https://api.bog.ge') },
      { key: 'BOG_RETURN_URL', value: String(body.BOG_RETURN_URL) },
      { key: 'BOG_CALLBACK_URL', value: String(body.BOG_CALLBACK_URL) },
    ]
    await prisma.$transaction(items.map(i => prisma.setting.create({ data: i })))

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}


