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
      question: `Generate exactly 4 engaging Georgian chat suggestions in question format. Each should be a complete question that users can ask. Return as JSON array of strings. Examples: "მირჩიე ფილმი საღამოსთვის", "როგორ გავაუმჯობესო ძილის ხარისხი?". Seed: ${seed}`,
      history: [],
      overrideConfig: { sessionId: `suggest_${Date.now()}_${seed}`, temperature: 0.8 }
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
    let suggestions: string[] = []

    const extractSuggestions = (payload: any): string[] => {
      if (!payload) return []
      // If payload itself is an array
      if (Array.isArray(payload)) return payload
      // Common shapes: { suggestions: [...] }
      if (Array.isArray(payload.suggestions)) return payload.suggestions
      // { text: [...] }
      if (Array.isArray(payload.text)) return payload.text
      // { text: "[ ... ]" } or plain string JSON
      const textField = typeof payload === 'string' ? payload : payload.text
      if (typeof textField === 'string') {
        try {
          const parsed = JSON.parse(textField)
          if (Array.isArray(parsed)) return parsed
        } catch {}
      }
      return []
    }

    if (contentType.includes('application/json')) {
      try {
        const json = await res.json()
        suggestions = extractSuggestions(json)
      } catch {
        suggestions = []
      }
    } else {
      // text response
      const raw = await res.text()
      try {
        const parsed = JSON.parse(raw)
        suggestions = extractSuggestions(parsed)
      } catch {
        // Fallback: split lines
        suggestions = (raw || '')
          .split(/\r?\n+/)
          .map((s) => s.replace(/^[-*\d.\s]+/, '').trim())
          .filter(Boolean)
          .slice(0, 4)
      }
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


