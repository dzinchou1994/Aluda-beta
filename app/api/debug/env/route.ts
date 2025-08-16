import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const host = process.env.ALUDAAI_FLOWISE_HOST || process.env.FLOWISE_HOST || null
  const mini = process.env.ALUDAAI_FLOWISE_CHATFLOW_ID || process.env.FLOWISE_CHATFLOW_ID || null
  const aluda2 = process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2
    || process.env.FLOWISE_CHATFLOW_ID_ALUDAA2
    || (process.env as any).ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDA2
    || null
  return NextResponse.json({
    present: { host: Boolean(host), mini: Boolean(mini), aluda2: Boolean(aluda2) },
    values: { host, mini, aluda2 },
    vercel: { env: process.env.VERCEL_ENV || null, url: process.env.VERCEL_URL || null },
  })
}


