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

    console.log('BOG Callback received:', JSON.stringify(payload, null, 2))

    if (!verifyBogCallback(payload)) {
      console.error('BOG Callback verification failed')
      return NextResponse.json({ error: 'Invalid callback' }, { status: 400 })
    }

    // BOG sends: event: "order_payment" and body.order_id
    const event = payload.event
    const orderId = payload.body?.order_id || payload.order_id || ''
    
    console.log('BOG Callback event:', event, 'orderId:', orderId)

    // Our order format: aluda_{userId}_{timestamp}
    const userId = orderId.split('_')[1]

    console.log('Extracted userId:', userId)

    if (event === 'order_payment' && userId) {
      try {
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: userId }
        })
        
        if (user) {
          console.log('Updating user plan to PREMIUM:', userId)
          await prisma.user.update({ 
            where: { id: userId }, 
            data: { plan: 'PREMIUM' } 
          })
          console.log('User plan updated successfully')
        } else {
          console.error('User not found:', userId)
        }
      } catch (dbError) {
        console.error('Database update error:', dbError)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('BOG callback error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}


