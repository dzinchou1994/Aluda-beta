import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Require explicit database URL; avoid silently connecting to a default DB
const databaseUrl = process.env.ALUDAAI_DATABASE_URL || process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    'Database URL is not configured. Set ALUDAAI_DATABASE_URL or DATABASE_URL in the environment.'
  )
}
const prismaOptions = databaseUrl
  ? ({ datasources: { db: { url: databaseUrl } } } as const)
  : ({} as const)

export const prisma = new PrismaClient(prismaOptions as any)

// Force disconnect on hot reload in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}


