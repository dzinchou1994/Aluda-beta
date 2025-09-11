import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function POST(req: NextRequest) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { secret } = await req.json().catch(() => ({ secret: '' })) as { secret?: string }
  // Normalize to avoid accidental whitespace mismatch
  const adminSecret = (process.env.ADMIN_SECRET || '').trim()
  const provided = (secret || '').trim()
  if (!adminSecret) return NextResponse.json({ ok: true })
  if (provided !== adminSecret) return NextResponse.json({ error: 'Invalid password' }, { status: 401 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_ok', '1', { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 8 })
  return res
}


