import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Get current BOG settings from database
    const bogSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['BOG_PUBLIC_KEY', 'BOG_SECRET_KEY', 'BOG_API_BASE', 'BOG_RETURN_URL', 'BOG_CALLBACK_URL']
        }
      }
    })

    // Get current environment variables
    const envVars = {
      BOG_PUBLIC_KEY: process.env.BOG_PUBLIC_KEY,
      BOG_SECRET_KEY: process.env.BOG_SECRET_KEY ? 'jBN***' : null,
      BOG_API_BASE: process.env.BOG_API_BASE,
      BOG_RETURN_URL: process.env.BOG_RETURN_URL,
      BOG_CALLBACK_URL: process.env.BOG_CALLBACK_URL
    }

    return NextResponse.json({
      present: {
        env: {
          BOG_PUBLIC_KEY: !!envVars.BOG_PUBLIC_KEY,
          BOG_SECRET_KEY: !!envVars.BOG_SECRET_KEY,
          BOG_API_BASE: !!envVars.BOG_API_BASE,
          BOG_RETURN_URL: !!envVars.BOG_RETURN_URL,
          BOG_CALLBACK_URL: !!envVars.BOG_CALLBACK_URL
        },
        db: {
          BOG_PUBLIC_KEY: bogSettings.find(s => s.key === 'BOG_PUBLIC_KEY')?.value !== null,
          BOG_SECRET_KEY: bogSettings.find(s => s.key === 'BOG_SECRET_KEY')?.value !== null,
          BOG_API_BASE: bogSettings.find(s => s.key === 'BOG_API_BASE')?.value !== null,
          BOG_RETURN_URL: bogSettings.find(s => s.key === 'BOG_RETURN_URL')?.value !== null,
          BOG_CALLBACK_URL: bogSettings.find(s => s.key === 'BOG_CALLBACK_URL')?.value !== null
        }
      },
      values: {
        env: envVars,
        db: {
          BOG_PUBLIC_KEY: bogSettings.find(s => s.key === 'BOG_PUBLIC_KEY')?.value || null,
          BOG_SECRET_KEY: bogSettings.find(s => s.key === 'BOG_SECRET_KEY')?.value || null,
          BOG_API_BASE: bogSettings.find(s => s.key === 'BOG_API_BASE')?.value || null,
          BOG_RETURN_URL: bogSettings.find(s => s.key === 'BOG_RETURN_URL')?.value || null,
          BOG_CALLBACK_URL: bogSettings.find(s => s.key === 'BOG_CALLBACK_URL')?.value || null
        }
      }
    })
  } catch (error: any) {
    console.error('Debug env error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'fixBogEnv') {
      // Fix BOG environment variables in database
      const envVars = {
        BOG_PUBLIC_KEY: process.env.BOG_PUBLIC_KEY,
        BOG_SECRET_KEY: process.env.BOG_SECRET_KEY,
        BOG_API_BASE: process.env.BOG_API_BASE,
        BOG_RETURN_URL: process.env.BOG_RETURN_URL,
        BOG_CALLBACK_URL: process.env.BOG_CALLBACK_URL
      }

      const results = []

      for (const [key, value] of Object.entries(envVars)) {
        if (value) {
          try {
            const setting = await prisma.setting.upsert({
              where: { key },
              update: { value },
              create: { key, value }
            })
            results.push({ key, status: 'updated', value: setting.value })
          } catch (error) {
            results.push({ 
              key, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          }
        }
      }

      return NextResponse.json({
        message: 'BOG environment variables fixed',
        results
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Debug env POST error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}


