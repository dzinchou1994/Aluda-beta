import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Prefer local environment variables for database URL, fallback to default Neon URL
const databaseUrl =
  process.env.ALUDAAI_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_Kdjq5JEbg6ei@ep-broad-fire-a2mlchsd-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
const prismaOptions = databaseUrl
  ? ({ datasources: { db: { url: databaseUrl } } } as const)
  : ({} as const)

export const prisma = new PrismaClient(prismaOptions as any)

// Force disconnect on hot reload in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}


