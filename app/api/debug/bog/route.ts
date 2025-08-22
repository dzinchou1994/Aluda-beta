import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const env = process.env as Record<string, string | undefined>
  const dbRows = await (prisma as any).setting.findMany({ where: { key: { in: ['BOG_PUBLIC_KEY','BOG_SECRET_KEY','BOG_API_BASE','BOG_RETURN_URL','BOG_CALLBACK_URL'] } } })
  const db = Object.fromEntries((dbRows as any[]).map((r: any) => [r.key, r.value])) as Record<string, string | undefined>

  const present = {
    env: {
      BOG_PUBLIC_KEY: Boolean(env.BOG_PUBLIC_KEY),
      BOG_SECRET_KEY: Boolean(env.BOG_SECRET_KEY),
      BOG_API_BASE: Boolean(env.BOG_API_BASE),
      BOG_RETURN_URL: Boolean(env.BOG_RETURN_URL),
      BOG_CALLBACK_URL: Boolean(env.BOG_CALLBACK_URL),
    },
    db: {
      BOG_PUBLIC_KEY: Boolean(db.BOG_PUBLIC_KEY),
      BOG_SECRET_KEY: Boolean(db.BOG_SECRET_KEY),
      BOG_API_BASE: Boolean(db.BOG_API_BASE),
      BOG_RETURN_URL: Boolean(db.BOG_RETURN_URL),
      BOG_CALLBACK_URL: Boolean(db.BOG_CALLBACK_URL),
    }
  }
  const values = {
    env: {
      BOG_PUBLIC_KEY: env.BOG_PUBLIC_KEY || null,
      BOG_SECRET_KEY: env.BOG_SECRET_KEY ? `${env.BOG_SECRET_KEY.slice(0, 3)}***` : null,
      BOG_API_BASE: env.BOG_API_BASE || null,
      BOG_RETURN_URL: env.BOG_RETURN_URL || null,
      BOG_CALLBACK_URL: env.BOG_CALLBACK_URL || null,
    },
    db: {
      BOG_PUBLIC_KEY: db.BOG_PUBLIC_KEY || null,
      BOG_SECRET_KEY: db.BOG_SECRET_KEY ? `${db.BOG_SECRET_KEY.slice(0, 3)}***` : null,
      BOG_API_BASE: db.BOG_API_BASE || null,
      BOG_RETURN_URL: db.BOG_RETURN_URL || null,
      BOG_CALLBACK_URL: db.BOG_CALLBACK_URL || null,
    }
  }
  return NextResponse.json({ present, values })
}


