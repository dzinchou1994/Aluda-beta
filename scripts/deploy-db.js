const { PrismaClient } = require('@prisma/client');

async function deployDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.ALUDAAI_DATABASE_URL,
      },
    },
  });

  try {
    console.log('🚀 Starting database deployment...');
    
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Run migrations
    console.log('🔄 Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Verify tables exist
    console.log('✅ Verifying database tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log('📊 Database tables created:', tables.map(t => t.table_name));
    
    // Test database connection
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test basic operations
    console.log('🧪 Testing basic database operations...');
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible. Current user count: ${userCount}`);
    
    const tokenUsageCount = await prisma.tokenUsage.count();
    console.log(`✅ TokenUsage table accessible. Current usage records: ${tokenUsageCount}`);
    
    console.log('🎉 Database deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ Database deployment failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deployDatabase();
