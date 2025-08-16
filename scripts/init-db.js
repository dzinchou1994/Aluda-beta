const { PrismaClient } = require('@prisma/client');

async function initializeDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.ALUDAAI_DATABASE_URL,
      },
    },
  });

  try {
    console.log('🚀 Initializing database with direct schema push...');
    
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Try to push schema directly (this will create tables)
    console.log('🔄 Pushing database schema...');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Schema pushed successfully!');
    } catch (pushError) {
      console.log('⚠️ Schema push failed, trying migrations...');
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        console.log('✅ Migrations applied successfully!');
      } catch (migrateError) {
        console.log('❌ Both push and migrations failed. Creating tables manually...');
        await createTablesManually(prisma);
      }
    }
    
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
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createTablesManually(prisma) {
  console.log('🔧 Creating tables manually...');
  
  // Create User table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT,
      "username" TEXT,
      "email" TEXT,
      "emailVerified" DATETIME,
      "image" TEXT,
      "password" TEXT,
      "plan" TEXT NOT NULL DEFAULT 'USER',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `;
  
  // Create Account table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Account" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "refresh_token" TEXT,
      "access_token" TEXT,
      "expires_at" INTEGER,
      "token_type" TEXT,
      "scope" TEXT,
      "id_token" TEXT,
      "session_state" TEXT
    )
  `;
  
  // Create Session table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionToken" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "expires" DATETIME NOT NULL
    )
  `;
  
  // Create VerificationToken table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "VerificationToken" (
      "identifier" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "expires" DATETIME NOT NULL
    )
  `;
  
  // Create Chat table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Chat" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `;
  
  // Create Message table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Message" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "role" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "chatId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "meta" TEXT
    )
  `;
  
  // Create TokenUsage table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "TokenUsage" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "actorType" TEXT NOT NULL,
      "actorId" TEXT NOT NULL,
      "period" TEXT NOT NULL,
      "periodKey" TEXT NOT NULL,
      "tokens" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `;
  
  // Create indexes
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`;
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`;
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")`;
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken")`;
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token")`;
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "TokenUsage_actorType_actorId_period_periodKey_key" ON "TokenUsage"("actorType", "actorId", "period", "periodKey")`;
  
  console.log('✅ Tables created manually!');
}

initializeDatabase();
