import { NextRequest, NextResponse } from "next/server"
import { addUsage, canConsume, getUsage } from "@/lib/tokens"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing token tracking in production...')
    
    // Check environment variables
    console.log('🔍 Environment check:')
    console.log('DISABLE_TOKEN_TRACKING:', process.env.DISABLE_TOKEN_TRACKING || 'NOT SET')
    console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET')
    console.log('ALUDAAI_DATABASE_URL:', process.env.ALUDAAI_DATABASE_URL ? 'SET' : 'NOT SET')
    
    // Test database connection
    console.log('\n🔍 Testing database connection...')
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful:', dbTest)
    
    // Create a test user
    console.log('\n👤 Creating test user...')
    const testUser = await prisma.user.create({
      data: {
        email: `test-prod-${Date.now()}@example.com`,
        plan: 'USER'
      }
    })
    console.log('✅ Test user created:', testUser.email, '(ID:', testUser.id, ')')
    
    // Test token consumption
    const actor = { type: 'user' as const, id: testUser.id, plan: 'USER' as const }
    const testTokens = 50
    
    console.log('\n💾 Testing token consumption...')
    console.log('Actor:', actor)
    console.log('Tokens to consume:', testTokens)
    
    // Test canConsume
    const consumptionCheck = await canConsume(actor, testTokens)
    console.log('✅ canConsume result:', consumptionCheck)
    
    // Test addUsage
    await addUsage(actor, testTokens)
    console.log('✅ addUsage successful!')
    
    // Verify usage was recorded
    const usage = await getUsage(actor)
    console.log('✅ Usage after consumption:', usage)
    
    // Clean up
    console.log('\n🧹 Cleaning up test data...')
    await prisma.tokenUsage.deleteMany({
      where: { actorId: testUser.id }
    })
    await prisma.user.delete({
      where: { id: testUser.id }
    })
    console.log('✅ Test data cleaned up')
    
    return NextResponse.json({
      success: true,
      message: 'Token tracking test completed successfully',
      environment: {
        DISABLE_TOKEN_TRACKING: process.env.DISABLE_TOKEN_TRACKING || 'NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'NOT SET',
        DATABASE_URL_SET: !!process.env.ALUDAAI_DATABASE_URL
      },
      testResults: {
        databaseConnection: 'SUCCESS',
        userCreation: 'SUCCESS',
        canConsume: consumptionCheck,
        addUsage: 'SUCCESS',
        finalUsage: usage
      }
    })
    
  } catch (error: any) {
    console.error('❌ Token tracking test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      environment: {
        DISABLE_TOKEN_TRACKING: process.env.DISABLE_TOKEN_TRACKING || 'NOT SET',
        NODE_ENV: process.env.NODE_ENV || 'NOT SET',
        DATABASE_URL_SET: !!process.env.ALUDAAI_DATABASE_URL
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Token tracking test endpoint',
    usage: 'POST to test token tracking functionality'
  })
}
