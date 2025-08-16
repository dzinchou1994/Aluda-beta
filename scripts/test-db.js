const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.ALUDAAI_DATABASE_URL,
      },
    },
  });

  try {
    console.log('🧪 Testing database functionality...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test User table
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible. Count: ${userCount}`);
    
    // Test TokenUsage table
    const tokenCount = await prisma.tokenUsage.count();
    console.log(`✅ TokenUsage table accessible. Count: ${tokenCount}`);
    
    // Test creating a test user
    console.log('🧪 Testing user creation...');
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        username: `testuser-${Date.now()}`,
        password: 'hashedpassword',
        plan: 'USER'
      }
    });
    console.log(`✅ Test user created with ID: ${testUser.id}`);
    
    // Test token usage creation
    console.log('🧪 Testing token usage creation...');
    const testUsage = await prisma.tokenUsage.create({
      data: {
        actorType: 'user',
        actorId: testUser.id,
        period: 'day',
        periodKey: new Date().toISOString().slice(0, 10),
        tokens: 100
      }
    });
    console.log(`✅ Test token usage created with ID: ${testUsage.id}`);
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await prisma.tokenUsage.delete({ where: { id: testUsage.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Test data cleaned up');
    
    console.log('🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
