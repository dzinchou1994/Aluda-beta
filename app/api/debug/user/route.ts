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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Debug user POST error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
