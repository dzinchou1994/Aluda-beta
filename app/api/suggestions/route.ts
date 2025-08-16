import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: NextRequest) {
  try {
    const host = process.env.ALUDAAI_FLOWISE_HOST || process.env.FLOWISE_HOST
    const chatflowId = process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_SUGGEST
    const apiKey = process.env.ALUDAAI_FLOWISE_API_KEY || process.env.FLOWISE_API_KEY

    if (!host || !chatflowId) {
      return NextResponse.json({ suggestions: [] }, { status: 200 })
    }

    const hostWithProtocol = /^(http|https):\/\//i.test(host) ? host : `https://${host}`
    const normalizedHost = hostWithProtocol.replace(/\/+$/, '')
    const url = `${normalizedHost}/api/v1/prediction/${chatflowId}`

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const seed = Math.floor(Math.random() * 1_000_000_000)
    const body = {
      question: `Suggest exactly 4 short Georgian chat topics as a JSON array of strings. No extra text. Vary topics on each request. Seed: ${seed}`,
      history: [],
      overrideConfig: { sessionId: `suggest_${Date.now()}_${seed}`, temperature: 0.9 }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return NextResponse.json({ suggestions: [] }, { status: 200 })
    }

    const contentType = res.headers.get('content-type') || ''
    const text = await (contentType.includes('application/json') ? res.json().then((d) => d?.text ?? d) : res.text())
    let suggestions: string[] = []

    try {
      const parsed = typeof text === 'string' ? JSON.parse(text) : JSON.parse(text?.text ?? '[]')
      if (Array.isArray(parsed)) suggestions = parsed
      else if (typeof parsed === 'object' && Array.isArray(parsed.suggestions)) suggestions = parsed.suggestions
    } catch {
      // Try to split by lines and take first 4
      const str = typeof text === 'string' ? text : String(text || '')
      suggestions = str
        .split(/\r?\n+/)
        .map((s) => s.replace(/^[-*\d.\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, 4)
    }

    // Final safety: clamp to 4 and clean
    suggestions = (suggestions || []).map((s) => String(s).trim()).filter(Boolean).slice(0, 4)

    return NextResponse.json(
      { suggestions },
      { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate' } }
    )
  } catch {
    return NextResponse.json(
      { suggestions: [] },
      { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate' } }
    )
  }
}


