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
  if (actor.type === 'guest') {
    return { daily: 1500, monthly: 10000, images: 2 }
  }
  if (actor.plan === 'PREMIUM') {
    return { daily: 25000, monthly: 300000, images: 60 }
  }
  return { daily: 7500, monthly: 60000, images: 5 }
}

export async function getUsage(actor: Actor) {
  // Local development mode - bypass database
  if (process.env.DISABLE_TOKEN_TRACKING === 'true') {
    console.log('Token tracking disabled for local development');
    return { daily: 0, monthly: 0, images: 0 };
  }

  const { day, month } = getPeriodKeys()
  const [daily, monthly, imageUsage] = await Promise.all([
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
    prisma.tokenUsage.findUnique({
      where: {
        actorType_actorId_period_periodKey: {
          actorType: actor.type,
          actorId: actor.id,
          period: 'month',
          periodKey: month,
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
        console.warn('ImageUsage lookup failed (proceeding with 0 images). Reason:', e?.message || e)
        return null
      }
    })(),
  ])
  return { 
    daily: daily?.tokens ?? 0, 
    monthly: monthly?.tokens ?? 0,
    images: imageUsage?.images ?? 0
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
    prisma.tokenUsage.upsert({
      where: {
        actorType_actorId_period_periodKey: {
          actorType: actor.type,
          actorId: actor.id,
          period: 'month',
          periodKey: month,
        },
      },
      update: { tokens: { increment: tokens } },
      create: {
        actorType: actor.type,
        actorId: actor.id,
        period: 'month',
        periodKey: month,
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
    console.warn('ImageUsage upsert failed (skipping). Reason:', e?.message || e)
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
    allowed: usage.daily + tokens <= limits.daily && usage.monthly + tokens <= limits.monthly,
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


