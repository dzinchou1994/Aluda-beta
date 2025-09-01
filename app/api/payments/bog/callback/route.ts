import { NextRequest, NextResponse } from 'next/server'
import { verifyBogCallback, BogCallbackPayload } from '@/lib/bog'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET method for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'BOG Callback endpoint is working!',
    timestamp: new Date().toISOString(),
    status: 'active'
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== BOG CALLBACK START ===')
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    const payload = (await request.json().catch(async () => {
      console.log('JSON parsing failed, trying form data...')
      const form = await request.formData().catch(() => null)
      if (form) {
        const obj: Record<string, any> = {}
        form.forEach((v, k) => { obj[k] = typeof v === 'string' ? v : String(v) })
        console.log('Form data parsed:', obj)
        return obj
      }
      console.log('Both JSON and form parsing failed')
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
    const orderParts = orderId.split('_')
    console.log('Order parts:', orderParts)
    
    const userId = orderParts[1]
    console.log('Extracted userId:', userId)

    if (event === 'order_payment' && userId) {
      try {
        console.log('Checking if user exists in database...')
        
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: userId }
        })
        
        console.log('User found:', user ? 'YES' : 'NO', 'User data:', user)
        
        if (user) {
          console.log('Updating user plan to PREMIUM:', userId)
          const updatedUser = await prisma.user.update({ 
            where: { id: userId }, 
            data: { plan: 'PREMIUM' } 
          })
          console.log('User plan updated successfully:', updatedUser.plan)
        } else {
          console.error('User not found in database:', userId)
          console.log('Available users in database:')
          try {
            const allUsers = await prisma.user.findMany({
              select: { id: true, email: true, plan: true }
            })
            console.log('All users:', allUsers)
          } catch (e) {
            console.error('Error fetching all users:', e)
          }
        }
      } catch (dbError) {
        console.error('Database update error:', dbError)
      }
    } else {
      console.log('Callback conditions not met:', { event, userId, hasEvent: Boolean(event), hasUserId: Boolean(userId) })
    }

    console.log('=== BOG CALLBACK END ===')
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('BOG callback error:', error)
    console.error('Error stack:', error?.stack)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}


