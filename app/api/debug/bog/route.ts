import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const env = process.env as Record<string, string | undefined>
  const present = {
    BOG_PUBLIC_KEY: Boolean(env.BOG_PUBLIC_KEY),
    BOG_SECRET_KEY: Boolean(env.BOG_SECRET_KEY),
    BOG_API_BASE: Boolean(env.BOG_API_BASE),
    BOG_RETURN_URL: Boolean(env.BOG_RETURN_URL),
    BOG_CALLBACK_URL: Boolean(env.BOG_CALLBACK_URL),
  }
  const values = {
    BOG_PUBLIC_KEY: env.BOG_PUBLIC_KEY || null,
    BOG_SECRET_KEY: env.BOG_SECRET_KEY ? `${env.BOG_SECRET_KEY.slice(0, 3)}***` : null,
    BOG_API_BASE: env.BOG_API_BASE || null,
    BOG_RETURN_URL: env.BOG_RETURN_URL || null,
    BOG_CALLBACK_URL: env.BOG_CALLBACK_URL || null,
  }
  return NextResponse.json({ present, values })
}


