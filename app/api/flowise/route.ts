import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const question = body?.question ?? body?.prompt ?? '';
    const overrideConfig = { renderHTML: true, ...(body?.overrideConfig || {}) };

    const host = process.env.FLOWISE_HOST;
    const chatflowId = process.env.FLOWISE_CHATFLOW_ID;

    if (!host || !chatflowId) {
      return NextResponse.json({ error: 'FLOWISE_HOST or FLOWISE_CHATFLOW_ID is not set' }, { status: 500 });
    }

    const url = `${host.replace(/\/$/, '')}/api/v1/prediction/${chatflowId}`;

    const upstreamRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, overrideConfig }),
      // No credentials or auth by default; configure Flowise security as needed
    });

    // Pass through status and JSON body
    const data = await upstreamRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstreamRes.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Flowise proxy error' }, { status: 500 });
  }
}


