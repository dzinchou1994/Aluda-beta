import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Check if database is already initialized
    try {
      const userCount = await prisma.user.count()
      return NextResponse.json({
        status: "already_initialized",
        message: "Database is already initialized",
        userCount
      })
    } catch (error) {
      // Database not initialized, continue with initialization
    }

    // Initialize database by creating tables
    console.log("Initializing database...")
    
    // Test connection
    await prisma.$connect()
    
    // Try to create a test user to verify tables exist
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        username: `testuser-${Date.now()}`,
        password: 'hashedpassword',
        plan: 'USER'
      }
    })
    
    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } })
    
    return NextResponse.json({
      status: "initialized",
      message: "Database initialized successfully",
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error("Database initialization failed:", error)
    
    // Try to create tables manually
    try {
      await createTablesManually()
      return NextResponse.json({
        status: "initialized_manual",
        message: "Database initialized manually",
        timestamp: new Date().toISOString()
      })
    } catch (manualError) {
      return NextResponse.json({
        status: "failed",
        error: "Database initialization failed",
        details: error.message
      }, { status: 500 })
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function createTablesManually() {
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
  `
  
  // Create other tables...
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
  `
  
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionToken" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "expires" DATETIME NOT NULL
    )
  `
  
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Chat" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `
  
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Message" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "role" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "chatId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "meta" TEXT
    )
  `
  
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
  `
  
  // Create indexes
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`
}
