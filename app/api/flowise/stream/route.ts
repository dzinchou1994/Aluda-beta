export async function POST(req: Request) {
  try {
    const body = await req.json();
    const question = body?.question ?? body?.prompt ?? '';
    const host = process.env.FLOWISE_HOST;
    const chatflowId = process.env.FLOWISE_CHATFLOW_ID;
    if (!host || !chatflowId) {
      return new Response('FLOWISE_HOST or FLOWISE_CHATFLOW_ID is not set', { status: 500 });
    }

    // Try streaming via same prediction endpoint with SSE and detailed streaming
    const url = `${host.replace(/\/$/, '')}/api/v1/prediction/${chatflowId}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        question,
        overrideConfig: { renderHTML: true, enableDetailedStreaming: true },
      }),
    });

    // If upstream didn't return SSE, forward body as-is
    const ct = upstream.headers.get('content-type') || '';
    if (!ct.includes('text/event-stream') || !upstream.body) {
      const text = await upstream.text();
      return new Response(text, { status: upstream.status, headers: { 'Content-Type': ct || 'application/json' } });
    }

    // Stream SSE back to client
    const { readable, writable } = new TransformStream();
    (async () => {
      const writer = writable.getWriter();
      const reader = upstream.body!.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) await writer.write(value);
        }
      } finally {
        try { await writer.close(); } catch {}
        try { reader.releaseLock(); } catch {}
      }
    })();

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (e: any) {
    return new Response(`Flowise stream proxy error: ${e?.message || 'unknown'}`, { status: 500 });
  }
}


