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
    return { daily: 1500, monthly: 10000 }
  }
  if (actor.plan === 'PREMIUM') {
    return { daily: 25000, monthly: 300000 }
  }
  return { daily: 7500, monthly: 60000 }
}

export async function getUsage(actor: Actor) {
  // Local development mode - bypass database
  if (process.env.DISABLE_TOKEN_TRACKING === 'true') {
    console.log('Token tracking disabled for local development');
    return { daily: 0, monthly: 0 };
  }

  const { day, month } = getPeriodKeys()
  const [daily, monthly] = await Promise.all([
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
  ])
  return { daily: daily?.tokens ?? 0, monthly: monthly?.tokens ?? 0 }
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

export async function canConsume(actor: Actor, tokens: number) {
  // Local development mode - always allow
  if (process.env.DISABLE_TOKEN_TRACKING === 'true') {
    console.log('Token consumption check disabled for local development');
    return {
      allowed: true,
      usage: { daily: 0, monthly: 0 },
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


