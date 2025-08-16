import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const databaseUrl = process.env.DATABASE_URL || process.env.ALUDAAI_DATABASE_URL
const prismaOptions = databaseUrl
  ? ({ datasources: { db: { url: databaseUrl } } } as const)
  : ({} as const)

export const prisma = global.prisma || new PrismaClient(prismaOptions as any)

if (process.env.NODE_ENV !== 'production') global.prisma = prisma


