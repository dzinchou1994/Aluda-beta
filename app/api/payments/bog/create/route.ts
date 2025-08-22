import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createBogOrder } from '@/lib/bog'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await request.json().catch(() => ({}))
    const { amount = 2000, currency = 'GEL' } = json || {}

    // Create unique order identifier bound to user
    const orderId = `aluda_${session.user.id}_${Date.now()}`

    const { redirectUrl, raw } = await createBogOrder({
      amount: typeof amount === 'number' ? amount : Number(amount),
      currency,
      orderId,
      description: 'Aluda Premium Monthly',
      customerEmail: session.user.email || undefined,
    })

    return NextResponse.json({ redirectUrl, orderId, raw })
  } catch (error: any) {
    console.error('BOG create error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}


