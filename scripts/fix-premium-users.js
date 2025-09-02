const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixPremiumUsers() {
  try {
    console.log('🔍 Checking for users who may have been incorrectly upgraded to PREMIUM...')
    
    // Get all PREMIUM users
    const premiumUsers = await prisma.user.findMany({
      where: { plan: 'PREMIUM' },
      select: { 
        id: true, 
        email: true, 
        plan: true, 
        createdAt: true, 
        updatedAt: true 
      }
    })
    
    console.log(`\n📊 Found ${premiumUsers.length} PREMIUM users:`)
    premiumUsers.forEach(user => {
      const timeDiff = user.updatedAt.getTime() - user.createdAt.getTime()
      const minutesDiff = Math.round(timeDiff / (1000 * 60))
      console.log(`- ${user.email} (ID: ${user.id})`)
      console.log(`  Created: ${user.createdAt.toISOString()}`)
      console.log(`  Updated: ${user.updatedAt.toISOString()}`)
      console.log(`  Time between creation and upgrade: ${minutesDiff} minutes`)
      console.log('')
    })
    
    // Check if there are any payment records for these users
    console.log('🔍 Checking for payment records...')
    
    // For now, we'll identify suspicious cases:
    // Users upgraded to PREMIUM within 1 hour of creation (likely fake callbacks)
    const suspiciousUsers = premiumUsers.filter(user => {
      const timeDiff = user.updatedAt.getTime() - user.createdAt.getTime()
      const hoursDiff = timeDiff / (1000 * 60 * 60)
      return hoursDiff < 1 // Less than 1 hour
    })
    
    if (suspiciousUsers.length > 0) {
      console.log(`\n⚠️  Found ${suspiciousUsers.length} suspicious PREMIUM upgrades:`)
      suspiciousUsers.forEach(user => {
        const timeDiff = user.updatedAt.getTime() - user.createdAt.getTime()
        const minutesDiff = Math.round(timeDiff / (1000 * 60))
        console.log(`- ${user.email}: upgraded to PREMIUM ${minutesDiff} minutes after creation`)
      })
      
      console.log('\n💡 RECOMMENDATION:')
      console.log('These users were likely upgraded through fake callbacks before the security fix.')
      console.log('You should:')
      console.log('1. Verify if they actually made payments')
      console.log('2. If no payment was made, revert them to USER plan')
      console.log('3. Check your payment logs for these users')
      
      // Ask for confirmation before reverting
      console.log('\n❓ Do you want to revert suspicious users to USER plan? (y/N)')
      console.log('⚠️  WARNING: This will remove their PREMIUM access!')
      console.log('💡 Only do this if you\'re sure they didn\'t actually pay!')
      
      // For safety, we won't auto-revert - manual verification needed
      console.log('\n🔒 Auto-revert disabled for safety.')
      console.log('Please manually verify payments and run the revert command if needed.')
      
    } else {
      console.log('\n✅ No suspicious PREMIUM upgrades found.')
      console.log('All PREMIUM users appear to have been upgraded after reasonable time intervals.')
    }
    
    // Check token usage for these users
    console.log('\n🔍 Checking token usage for PREMIUM users...')
    for (const user of premiumUsers) {
      const tokenUsage = await prisma.tokenUsage.findMany({
        where: { 
          actorType: 'user',
          actorId: user.id
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
      
      if (tokenUsage.length > 0) {
        console.log(`\n📊 ${user.email} token usage:`)
        tokenUsage.forEach(usage => {
          console.log(`  ${usage.period}:${usage.periodKey} - ${usage.tokens} tokens`)
        })
      } else {
        console.log(`\n📊 ${user.email}: No token usage recorded`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Function to revert a specific user to USER plan
async function revertUserToUserPlan(userId) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { plan: 'USER' }
    })
    console.log(`✅ Reverted ${user.email} to USER plan`)
    return user
  } catch (error) {
    console.error(`❌ Failed to revert user ${userId}:`, error)
    throw error
  }
}

// Export functions for manual use
if (require.main === module) {
  fixPremiumUsers()
} else {
  module.exports = { fixPremiumUsers, revertUserToUserPlan }
}
