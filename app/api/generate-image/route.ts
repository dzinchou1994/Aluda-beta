import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 })
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        // Use DALL·E 3 model for style/quality support
        model: 'dall-e-3',
        prompt,
        size,
        quality,
        style,
        n: 1,
        response_format: 'url',
      }),
    })

    if (!response.ok) {
      try {
        const errJson = await response.json()
        return NextResponse.json({ error: 'OpenAI error', details: errJson }, { status: response.status })
      } catch {
        const errText = await response.text()
        return NextResponse.json({ error: 'OpenAI error', details: errText }, { status: response.status })
      }
    }

    const data = await response.json()
    const first = data?.data?.[0]
    const url = first?.url || null
    const revised_prompt = first?.revised_prompt || null
    return NextResponse.json({ url, revised_prompt })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}


