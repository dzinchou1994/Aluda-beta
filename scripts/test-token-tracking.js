const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testTokenTracking() {
  try {
    console.log('🧪 Testing token tracking functionality...')
    
    // Check environment variable
    console.log(`\n🔍 Environment check:`)
    console.log(`DISABLE_TOKEN_TRACKING: ${process.env.DISABLE_TOKEN_TRACKING || 'NOT SET'}`)
    
    // Test user creation
    console.log(`\n👤 Creating test user...`)
    const testUser = await prisma.user.create({
      data: {
        email: `test-token-${Date.now()}@example.com`,
        plan: 'USER'
      }
    })
    console.log(`✅ Test user created: ${testUser.email} (ID: ${testUser.id})`)
    
    // Test token usage creation
    console.log(`\n💾 Testing token usage creation...`)
    const { day, month } = getPeriodKeys()
    
    // Create daily usage
    const dailyUsage = await prisma.tokenUsage.create({
      data: {
        actorType: 'user',
        actorId: testUser.id,
        period: 'day',
        periodKey: day,
        tokens: 100
      }
    })
    console.log(`✅ Daily token usage created: ${dailyUsage.tokens} tokens`)
    
    // Monthly usage no longer used
    
    // Test reading usage
    console.log(`\n📊 Testing usage retrieval...`)
    const retrievedDaily = await prisma.tokenUsage.findUnique({
      where: {
        actorType_actorId_period_periodKey: {
          actorType: 'user',
          actorId: testUser.id,
          period: 'day',
          periodKey: day,
        },
      },
    })
    
    const retrievedMonthly = null
    
    console.log(`✅ Daily usage retrieved: ${retrievedDaily?.tokens || 0} tokens`)
    console.log(`✅ Monthly usage skipped (daily-only policy)`) 
    
    // Test limits calculation
    console.log(`\n📏 Testing limits calculation...`)
    const userPlan = 'USER'
    const limits = getLimits({ type: 'user', id: testUser.id, plan: userPlan })
    console.log(`✅ Limits for ${userPlan} plan:`, limits)
    
    // Test consumption check
    console.log(`\n🔍 Testing consumption check...`)
    const canConsume = await checkConsumption({ type: 'user', id: testUser.id, plan: userPlan }, 200)
    console.log(`✅ Can consume 200 tokens: ${canConsume.allowed}`)
    console.log(`✅ Current usage:`, canConsume.usage)
    console.log(`✅ Limits:`, canConsume.limits)
    
    // Clean up
    console.log(`\n🧹 Cleaning up test data...`)
    await prisma.tokenUsage.deleteMany({
      where: { actorId: testUser.id }
    })
    await prisma.user.delete({
      where: { id: testUser.id }
    })
    console.log(`✅ Test data cleaned up`)
    
    console.log(`\n🎉 Token tracking test completed successfully!`)
    
  } catch (error) {
    console.error('❌ Error during token tracking test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Helper functions from tokens.ts
function getPeriodKeys(date = new Date()) {
  const day = date.toISOString().slice(0, 10) // YYYY-MM-DD
  const month = date.toISOString().slice(0, 7) // YYYY-MM
  return { day, month }
}

function getLimits(actor) {
  const DAILY_CAP = 8000
  const make = (images) => ({ daily: DAILY_CAP, monthly: 0, images })
  if (actor.type === 'guest') return make(2)
  if (actor.plan === 'PREMIUM') return make(60)
  return make(5)
}

async function checkConsumption(actor, tokens) {
  const limits = getLimits(actor)
  const usage = await getUsage(actor)
  return {
    allowed: usage.daily + tokens <= limits.daily,
    usage,
    limits,
  }
}

async function getUsage(actor) {
  const { day } = getPeriodKeys()
  const [daily] = await Promise.all([
    prisma.tokenUsage.findUnique({
      where: {
        actorType_actorId_period_periodKey: {
          actorType: actor.type,
          actorId: actor.id,
          period: 'day',
          periodKey: day,
        },
      },
    }),
  ])
  return { 
    daily: daily?.tokens ?? 0, 
    monthly: 0,
    images: 0
  }
}

if (require.main === module) {
  testTokenTracking()
}
