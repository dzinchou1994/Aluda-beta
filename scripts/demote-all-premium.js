const { PrismaClient } = require('@prisma/client')

async function demoteAllPremium() {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: process.env.ALUDAAI_DATABASE_URL },
    },
  })

  try {
    console.log('Connecting to database...')
    await prisma.$connect()
    console.log('Connected.')

    const before = await prisma.user.findMany({
      where: { plan: 'PREMIUM' },
      select: { id: true, email: true, createdAt: true, updatedAt: true },
    })
    console.log(`Found ${before.length} PREMIUM users`)
    if (before.length > 0) {
      before.slice(0, 25).forEach((u) =>
        console.log(` - ${u.email || u.id} (since ${u.createdAt.toISOString()})`)
      )
      if (before.length > 25) console.log(' ... (truncated)')
    }

    const res = await prisma.user.updateMany({
      where: { plan: 'PREMIUM' },
      data: { plan: 'USER' },
    })
    console.log(`Demoted ${res.count} users to USER`)

    const after = await prisma.user.count({ where: { plan: 'PREMIUM' } })
    console.log(`Remaining PREMIUM users: ${after}`)
    console.log('Done.')
  } catch (e) {
    console.error('Failed:', e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) demoteAllPremium()
module.exports = { demoteAllPremium }


