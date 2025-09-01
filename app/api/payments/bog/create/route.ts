import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createBogOrder } from '@/lib/bog'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('=== BOG CREATE ORDER START ===')
    console.log('Session user ID:', session.user.id)
    console.log('Session user email:', session.user.email)
    console.log('Full session data:', JSON.stringify(session, null, 2))

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, plan: true }
    })

    if (!user) {
      console.error('User not found in database:', session.user.id)
      console.log('Available users in database:')
      try {
        const allUsers = await prisma.user.findMany({
          select: { id: true, email: true, plan: true }
        })
        console.log('All users:', allUsers)
        
        // Try to find user by email
        if (session.user.email) {
          const userByEmail = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, email: true, plan: true }
          })
          console.log('User found by email:', userByEmail)
          
          // If user found by email, use that user ID instead
          if (userByEmail) {
            console.log('Using user found by email:', userByEmail.id)
            // Update session user ID to match database
            session.user.id = userByEmail.id
          } else {
            // Create user if not exists
            console.log('Creating new user for email:', session.user.email)
            try {
              const newUser = await prisma.user.create({
                data: {
                  email: session.user.email,
                  name: session.user.name || 'User',
                  plan: 'USER'
                },
                select: { id: true, email: true, plan: true }
              })
              console.log('New user created:', newUser)
              session.user.id = newUser.id
            } catch (createError) {
              console.error('Error creating user:', createError)
              return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
            }
          }
        }
      } catch (e) {
        console.error('Error fetching all users:', e)
      }
      
      // If still no user found, return error
      if (!session.user.id) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
      }
    }

    console.log('Database user found:', user)

    const json = await request.json().catch(() => ({}))
    const { amount = 100, currency = 'GEL' } = json || {}

    // Create unique order identifier bound to user
    const orderId = `aluda_${session.user.id}_${Date.now()}`
    console.log('Generated order ID:', orderId)
    console.log('Final user ID for payment:', session.user.id)

    const { redirectUrl, raw } = await createBogOrder({
      amount: typeof amount === 'number' ? amount : Number(amount),
      currency,
      orderId,
      description: 'Aluda Premium Monthly',
      customerEmail: session.user.email || undefined,
    })

    console.log('=== BOG CREATE ORDER END ===')
    return NextResponse.json({ redirectUrl, orderId, raw })
  } catch (error: any) {
    console.error('BOG create error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}


