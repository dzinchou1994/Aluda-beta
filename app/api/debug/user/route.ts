import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    console.log('Debug: Session user ID:', session.user.id)
    console.log('Debug: Session user email:', session.user.email)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        plan: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      console.log('Debug: User not found by ID, searching by email...')
      
      // Try to find user by email
      const userByEmail = await prisma.user.findMany({
        where: { email: session.user.email },
        select: {
          id: true,
          email: true,
          plan: true,
          createdAt: true,
          updatedAt: true
        }
      })

      console.log('Debug: Users found by email:', userByEmail)

      return NextResponse.json({
        error: 'User not found by ID',
        session: {
          userId: session.user.id,
          email: session.user.email
        },
        usersByEmail: userByEmail,
        message: 'User exists in database but with different ID. Session needs to be updated.'
      })
    }

    // Also check if there are other users with the same email
    const usersWithSameEmail = await prisma.user.findMany({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        plan: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: 'User debug info',
      user,
      usersWithSameEmail,
      session: {
        userId: session.user.id,
        email: session.user.email
      }
    })
  } catch (error: any) {
    console.error('Debug user error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    const { action, plan, email } = await request.json()

    if (action === 'updatePlan' && plan) {
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { plan },
        select: {
          id: true,
          email: true,
          plan: true,
          updatedAt: true
        }
      })

      return NextResponse.json({
        message: 'Plan updated successfully',
        user: updatedUser
      })
    }

    if (action === 'updatePlanByEmail' && plan && email) {
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { plan },
        select: {
          id: true,
          email: true,
          plan: true,
          updatedAt: true
        }
      })

      return NextResponse.json({
        message: 'Plan updated successfully by email',
        user: updatedUser
      })
    }

    if (action === 'fixSessionUserId' && email) {
      // Find user by email and return the correct user ID for session update
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          plan: true
        }
      })

      if (user) {
        return NextResponse.json({
          message: 'Session user ID fix info',
          currentSessionId: session.user.id,
          correctUserId: user.id,
          user,
          instructions: 'Update session to use correct user ID: ' + user.id
        })
      } else {
        return NextResponse.json({ error: 'User not found by email' }, { status: 404 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Debug user POST error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
