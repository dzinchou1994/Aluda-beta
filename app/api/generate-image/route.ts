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
        model: 'gpt-image-1',
        prompt,
        size,
        quality,
        style,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: 'OpenAI error', details: err }, { status: response.status })
    }

    const data = await response.json()
    // Return the first image base64 or URL depending on API
    const image = data?.data?.[0]
    return NextResponse.json({ image })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}


