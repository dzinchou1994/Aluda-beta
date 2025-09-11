import { prisma } from '@/lib/prisma'

export type Actor =
  | { type: 'guest'; id: string }
  | { type: 'user'; id: string; plan?: 'USER' | 'PREMIUM' }

export function getPeriodKeys(date = new Date()) {
  const day = date.toISOString().slice(0, 10) // YYYY-MM-DD
  const month = date.toISOString().slice(0, 7) // YYYY-MM
  return { day, month }
}

export function getLimits(actor: Actor) {
  // Daily-only token policy: one fixed daily cap across tiers
  // Monthly token limits are not enforced anymore and set to 0.
  const DAILY_CAP = 8000
  const make = (images: number) => ({
    daily: DAILY_CAP,
    monthly: 0,
    images,
  })

  if (actor.type === 'guest') {
    return make(2)
  }
  if (actor.plan === 'PREMIUM') {
    return make(60)
  }
  return make(5)
}

export async function getUsage(actor: Actor) {
  // Local development mode - bypass database
  if (process.env.DISABLE_TOKEN_TRACKING === 'true') {
    console.log('Token tracking disabled for local development');
    return { daily: 0, monthly: 0, images: 0 };
  }

  const { day, month } = getPeriodKeys()
  const [daily, imageUsage] = await Promise.all([
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
    (async () => {
      try {
        return await prisma.imageUsage.findUnique({
          where: {
            actorType_actorId_period_periodKey: {
              actorType: actor.type,
              actorId: actor.id,
              period: 'month',
              periodKey: month,
            },
          },
        })
      } catch (e: any) {
        // If table is missing, bootstrap it and continue with 0 usage
        await ensureImageUsageSchema()
        return null
      }
    })(),
  ])
  return {
    daily: daily?.tokens ?? 0,
    monthly: 0,
    images: imageUsage?.images ?? 0,
  }
}

export async function addUsage(actor: Actor, tokens: number) {
  // Local development mode - bypass database
  if (process.env.DISABLE_TOKEN_TRACKING === 'true') {
    console.log('Token usage tracking disabled for local development, tokens:', tokens);
    return;
  }

  const { day, month } = getPeriodKeys()
  await prisma.$transaction([
    prisma.tokenUsage.upsert({
      where: {
        actorType_actorId_period_periodKey: {
          actorType: actor.type,
          actorId: actor.id,
          period: 'day',
          periodKey: day,
        },
      },
      update: { tokens: { increment: tokens } },
      create: {
        actorType: actor.type,
        actorId: actor.id,
        period: 'day',
        periodKey: day,
        tokens,
      },
    }),
  ])
}

export async function addImageUsage(actor: Actor, images: number = 1) {
  // Local development mode - bypass database
  if (process.env.DISABLE_TOKEN_TRACKING === 'true') {
    console.log('Image usage tracking disabled for local development, images:', images);
    return;
  }

  const { month } = getPeriodKeys()
  try {
    // Ensure table/index exists (no-op if already present)
    await ensureImageUsageSchema()
    await prisma.imageUsage.upsert({
      where: {
        actorType_actorId_period_periodKey: {
          actorType: actor.type,
          actorId: actor.id,
          period: 'month',
          periodKey: month,
        },
      },
      update: { images: { increment: images } },
      create: {
        actorType: actor.type,
        actorId: actor.id,
        period: 'month',
        periodKey: month,
        images,
      },
    })
  } catch (e: any) {
    // Try to self-heal once and retry
    try {
      await ensureImageUsageSchema()
      await prisma.imageUsage.upsert({
        where: {
          actorType_actorId_period_periodKey: {
            actorType: actor.type,
            actorId: actor.id,
            period: 'month',
            periodKey: month,
          },
        },
        update: { images: { increment: images } },
        create: {
          actorType: actor.type,
          actorId: actor.id,
          period: 'month',
          periodKey: month,
          images,
        },
      })
    } catch (e2: any) {
      console.warn('ImageUsage upsert failed after ensure (skipping). Reason:', e2?.message || e2)
    }
  }
}

export async function canConsume(actor: Actor, tokens: number) {
  // Local development mode - always allow
  if (process.env.DISABLE_TOKEN_TRACKING === 'true') {
    console.log('Token consumption check disabled for local development');
    return {
      allowed: true,
      usage: { daily: 0, monthly: 0, images: 0 },
      limits: getLimits(actor),
    };
  }

  const limits = getLimits(actor)
  const usage = await getUsage(actor)
  return {
    allowed: usage.daily + tokens <= limits.daily,
    usage,
    limits,
  }
}

export async function canGenerateImage(actor: Actor) {
  // Local development mode - always allow
  if (process.env.DISABLE_TOKEN_TRACKING === 'true') {
    console.log('Image generation check disabled for local development');
    return {
      allowed: true,
      usage: { daily: 0, monthly: 0, images: 0 },
      limits: getLimits(actor),
    };
  }

  const limits = getLimits(actor)
  const usage = await getUsage(actor)
  return {
    allowed: usage.images < limits.images,
    usage,
    limits,
  }
}

// Ensure ImageUsage table and unique index exist (Postgres-safe)
async function ensureImageUsageSchema() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ImageUsage" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "actorType" TEXT NOT NULL,
        "actorId" TEXT NOT NULL,
        "period" TEXT NOT NULL,
        "periodKey" TEXT NOT NULL,
        "images" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ImageUsage_actorType_actorId_period_periodKey_key"
      ON "ImageUsage" ("actorType", "actorId", "period", "periodKey");
    `)
  } catch (e: any) {
    // Ignore if permission denied in restricted envs; normal operations may still work if table exists
  }
}


