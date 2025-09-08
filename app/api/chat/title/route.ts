import { NextRequest, NextResponse } from 'next/server'
import { suggestTitleWithAI } from '@/lib/flowise'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const { question, sessionId, chatflowIdOverride } = await req.json()
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'question is required' }, { status: 400 })
    }
    const sid = sessionId || `title_${Date.now()}`
    const title = await suggestTitleWithAI({
      question,
      sessionId: sid,
      chatflowIdOverride,
    })
    return NextResponse.json({ title: (title || '').trim() })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


