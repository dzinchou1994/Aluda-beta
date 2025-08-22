import { NextRequest, NextResponse } from 'next/server'
import { verifyBogCallback, BogCallbackPayload } from '@/lib/bog'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(async () => {
      const form = await request.formData().catch(() => null)
      if (form) {
        const obj: Record<string, any> = {}
        form.forEach((v, k) => { obj[k] = typeof v === 'string' ? v : String(v) })
        return obj
      }
      return {}
    })) as BogCallbackPayload

    if (!verifyBogCallback(payload)) {
      return NextResponse.json({ error: 'Invalid callback' }, { status: 400 })
    }

    const status = (payload.status || '').toLowerCase()
    const orderId = payload.order_id || ''

    // Our order format: aluda_{userId}_{timestamp}
    const userId = orderId.split('_')[1]

    if (status === 'success' || status === 'paid' || status === 'approved') {
      if (userId) {
        await prisma.user.update({ where: { id: userId }, data: { plan: 'PREMIUM' } })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('BOG callback error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}


