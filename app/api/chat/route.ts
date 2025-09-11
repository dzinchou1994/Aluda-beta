import { NextRequest, NextResponse } from "next/server"
import { sendToFlowiseWithRetry, suggestTitleWithAI } from "@/lib/flowise"
import { rateLimit } from "@/lib/rateLimit"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getOrCreateSession } from "@/lib/session"
import { addUsage, canConsume } from "@/lib/tokens"
import { prisma } from "@/lib/prisma"
// import { suggestTitleWithGroq } from "@/lib/groq"

export const runtime = 'nodejs'

/**
 * Clean AI response by removing unwanted characters and symbols
 * This fixes issues where AI sometimes returns Chinese/Russian characters mixed with Georgian text
 */
function cleanAIResponse(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // Remove Chinese characters (CJK Unified Ideographs) - more specific ranges
  let cleaned = text.replace(/[\u4e00-\u9fff]/g, '');
  
  // Remove Russian Cyrillic characters (excluding Georgian)
  cleaned = cleaned.replace(/[\u0400-\u04FF]/g, '');
  
  // Clean up extra spaces but preserve text structure
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    // Basic rate limit by IP
    await rateLimit({ key: `chat_${request.ip || 'unknown'}`, windowMs: 10_000, max: 30 })
    const contentType = request.headers.get('content-type') || ''
    let message: string = ''
    let chatId: string | undefined
    let model: string | undefined
    let uploadedFile: File | null = null
    let historyFromRequest: any[] = []

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      // Support both our field names and AI chatbot-style 'question'
      message = String(form.get('message') || form.get('question') || '')
      chatId = form.get('chatId') ? String(form.get('chatId')) : undefined
      model = form.get('model') ? String(form.get('model')) : undefined
      // AI service expects 'files' for prediction multipart, but support multiple common aliases
      const f = form.get('files') || form.get('file') || form.get('files[]') || form.get('upload') || form.get('image') || form.get('images')
      // Be permissive: in some runtimes the object may be a Blob, not strictly a File
      if (f && typeof f === 'object' && 'arrayBuffer' in (f as any)) {
        uploadedFile = f as unknown as File
      }
      console.log('API multipart debug:', {
        contentType,
        hasFile: Boolean(uploadedFile),
        fileName: uploadedFile?.name,
        fileSize: uploadedFile?.size,
        fileType: uploadedFile?.type,
        model,
      })
    } else {
      const json = await request.json()
      message = json?.message || ''
      chatId = json?.chatId
      model = json?.model
      // Get history from request if provided
      historyFromRequest = json?.history || []
      console.log('Chat API: Received history:', historyFromRequest.length, 'messages')
    }

    if (!message?.trim() && !uploadedFile) {
      return NextResponse.json(
        { error: "შეტყობინება ან სურათი საჭიროა" },
        { status: 400 }
      )
    }

    // Reject overly large files early with a clear error to avoid upstream 413
    if (uploadedFile && uploadedFile.size > 2_500_000) {
      return NextResponse.json(
        { error: 'სურათი ძალიან დიდია (მაქს. ~2.5MB). გთხოვთ ატვირთოთ უფრო მცირე ან დაიწიეთ ხარისხი.' },
        { status: 413 }
      )
    }

    // Identify actor
    const session = await getServerSession(authOptions)
    const cookieSess = getOrCreateSession()
    // Load user plan from DB if logged in
    let actor: any
    if (session?.user?.id) {
      const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } })
      actor = { type: 'user' as const, id: session.user.id, plan: (dbUser?.plan || 'USER') as 'USER' | 'PREMIUM' }
    } else {
      actor = { type: 'guest' as const, id: cookieSess.guestId || cookieSess.sessionId }
    }

    // Model handling: 'plus', 'free', or 'aluda_test' (internal)
    const selectedModel = (model === 'plus' || model === 'aluda2')
      ? 'plus'
      : (model === 'free' || model === 'test')
      ? 'free'
      : (model === 'aluda_test')
      ? 'aluda_test'
      : 'free'
    // Premium users default to plus without extra token multiplier
    const isPremium = actor.type === 'user' && actor.plan === 'PREMIUM'
    // Free model consumes tokens; internal 'aluda_test' remains free
    const tokenMultiplier = selectedModel === 'aluda_test' ? 0 : 1
    // Guests cannot use plus, but can use free model
    if (actor.type === 'guest' && selectedModel === 'plus') {
      return NextResponse.json({ error: 'გაიარეთ ავტორიზაცია Aluda Plus-ისთვის', redirect: '/auth/signin' }, { status: 402 })
    }
    // Enforce premium for Aluda Plus: non-premium logged-in users must upgrade
    if (actor.type === 'user' && selectedModel === 'plus' && !isPremium) {
      return NextResponse.json({ error: 'Aluda Plus ხელმისაწვდომია მხოლოდ PREMIUM მომხმარებლებისთვის', redirect: '/buy' }, { status: 402 })
    }

    // Rough token estimate (chars/4) and consumption check (skip only for internal test)
    let estimatedTokens = Math.ceil((message?.length || 0) / 4) * tokenMultiplier
    if (selectedModel !== 'aluda_test') {
      const { allowed, limits, usage } = await canConsume(actor, estimatedTokens)
      if (!allowed) {
        const target = actor.type === 'guest' ? '/auth/signin' : '/buy'
        return NextResponse.json({
          error: 'ტოკენების ლიმიტი ამოიწურა',
          redirect: target,
          limits,
          usage,
        }, { status: 402 })
      }
    }

    // Generate a unique chat ID with user context
    const currentChatId = chatId || `${actor.type}_${actor.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Check if client wants streaming
    const acceptHeader = request.headers.get('accept') || ''
    const xStreaming = request.headers.get('x-streaming')
    const wantsStreaming = acceptHeader.includes('text/event-stream') || xStreaming === 'true'
    
    console.log('Streaming check:', {
      acceptHeader,
      xStreaming,
      wantsStreaming,
      hasAcceptHeader: !!acceptHeader,
      hasXStreaming: !!xStreaming
    })

    if (wantsStreaming) {
      console.log('Starting streaming response...');
      
      if (uploadedFile) {
        // For now, we do not stream multipart/image requests; fall back to non-streaming logic
        console.log('Streaming disabled for multipart/image requests; falling back to non-stream');
      } else {
        // Implement streaming proxy to AI internal-prediction endpoint
        try {
          // Choose chatflow by model (streaming)
          const chatflowIdOverride = selectedModel === 'plus'
            ? (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2
              || process.env.FLOWISE_CHATFLOW_ID_ALUDAA2
              || (process.env as any).ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDA2)
            : selectedModel === 'free'
            ? (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_FREE || process.env.FLOWISE_CHATFLOW_ID_FREE || '286c3991-be03-47f3-aa47-56a6b65c5d00')
            : selectedModel === 'aluda_test'
            ? (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_TEST || process.env.FLOWISE_CHATFLOW_ID_TEST || '286c3991-be03-47f3-aa47-56a6b65c5d00')
            : (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID || process.env.FLOWISE_CHATFLOW_ID)

          if (selectedModel === 'plus' && !chatflowIdOverride) {
            return new Response(JSON.stringify({ error: 'Aluda Plus disabled: set ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2 in Vercel envs' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
          }

          // Prepare AI service host and endpoint
          const flowiseHost = process.env.ALUDAAI_FLOWISE_HOST || process.env.FLOWISE_HOST
          if (!flowiseHost || !chatflowIdOverride) {
            return new Response(JSON.stringify({ error: 'FLOWISE host or chatflow ID missing' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
          }
          const hostWithProtocol = /^(http|https):\/\//i.test(flowiseHost) ? flowiseHost : `https://${flowiseHost}`
          const normalizedHost = hostWithProtocol.replace(/\/+$/, '')
          const predictionUrl = `${normalizedHost}/api/v1/prediction/${chatflowIdOverride}`
          const apiKey = process.env.ALUDAAI_FLOWISE_API_KEY || process.env.FLOWISE_API_KEY

          // Use the provided chatId as session for Flowise memory
          const flowiseSessionId = chatId || `${actor.type}_${actor.id}_${selectedModel}_${Date.now()}`

          const upstream = await fetch(predictionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
              ...(apiKey ? { Authorization: `Bearer ${apiKey}`, 'x-api-key': apiKey } : {}),
            },
            body: JSON.stringify({
              question: message,
              history: historyFromRequest.map((msg: any) => ({
                role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                content: msg.content || ''
              })).slice(-10), // Keep only last 10 messages for performance
              overrideConfig: { renderHTML: true, sessionId: flowiseSessionId },
            }),
          })

          if (!upstream.ok) {
            const text = await upstream.text().catch(() => '')
            return new Response(text || 'Upstream error', { status: upstream.status, headers: { 'Content-Type': upstream.headers.get('content-type') || 'text/plain' } })
          }

          const ct = upstream.headers.get('content-type') || ''
          if (!ct.includes('text/event-stream') || !upstream.body) {
            const text = await upstream.text().catch(() => '')
            // Best-effort token accounting even when upstream didn't stream
            try {
              const tm = selectedModel === 'aluda_test' ? 0 : 1
              const assistantTokens = Math.ceil((text.length || 0) / 4) * tm
              const promptTokens = Math.ceil((message?.length || 0) / 4) * tm
              if (selectedModel !== 'aluda_test') {
                await addUsage(actor, promptTokens + assistantTokens)
              }
            } catch {}
            const contentType = (upstream.headers.get('content-type') || 'text/plain')
            return new Response(text, { status: upstream.status, headers: { 'Content-Type': contentType } })
          }

          // Stream SSE back to client while accumulating tokens for usage accounting
          const { readable, writable } = new TransformStream();
          const writer = writable.getWriter();
          const reader = upstream.body.getReader();
          const decoder = new TextDecoder();
          let pending = ''
          let fullContent = ''

          ;(async () => {
            try {
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                  await writer.write(value);
                  // Also parse the SSE chunk to accumulate token text
                  try {
                    const chunk = decoder.decode(value, { stream: true });
                    pending += chunk;
                    let idx: number;
                    while ((idx = pending.indexOf('\n')) !== -1) {
                      const line = pending.slice(0, idx).trim();
                      pending = pending.slice(idx + 1);
                      if (!line || !line.startsWith('data:')) continue;
                      const data = line.slice(5).trim();
                      if (!data) continue;
                      try {
                        const parsed = JSON.parse(data);
                        if (parsed && typeof parsed === 'object') {
                          if (parsed.event === 'end' || parsed.data === '[DONE]') {
                            // Will end naturally
                          } else if (parsed.event === 'metadata' || parsed.event === 'start') {
                            // ignore non-token events for accumulation
                          } else if (parsed.event === 'token') {
                            const token = typeof parsed.data === 'string' ? parsed.data : ''
                            if (token) fullContent += token
                          } else {
                            // Fallback only for string fields
                            const token = typeof parsed.data === 'string' ? parsed.data
                              : typeof parsed.text === 'string' ? parsed.text
                              : typeof parsed.message === 'string' ? parsed.message
                              : typeof parsed.answer === 'string' ? parsed.answer
                              : ''
                            if (token) fullContent += token
                          }
                        }
                      } catch {
                        if (data !== '[DONE]' && data.trim() !== '[DONE]') {
                          fullContent += data
                        }
                      }
                    }
                  } catch {}
                }
              }
            } finally {
              try { await writer.close(); } catch {}
              try { reader.releaseLock(); } catch {}
              // After streaming ends, attempt to track token usage (best-effort)
              try {
                // Clean up any remaining [DONE] markers from the final content
                fullContent = fullContent.replace(/\[DONE\]/g, '').trim();
                const tokenMultiplier = selectedModel === 'aluda_test' ? 0 : 1
                const assistantTokens = Math.ceil((fullContent.length || 0) / 4) * tokenMultiplier
                const promptTokens = Math.ceil((message?.length || 0) / 4) * tokenMultiplier
                if (selectedModel !== 'aluda_test') {
                  await addUsage(actor, promptTokens + assistantTokens)
                }
              } catch (e) {
                console.warn('Usage accounting after stream failed:', e)
              }
            }
          })();

          return new Response(readable, {
            status: 200,
            headers: {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
              'Transfer-Encoding': 'chunked',
              'X-Accel-Buffering': 'no',
            },
          })
        } catch (e: any) {
          return new Response(`Streaming error: ${e?.message || 'unknown'}`, { status: 500 })
        }
      }
    }

    // Non-streaming response (existing logic)
    const startTime = Date.now()
    let flowiseResponse
    let usedOverride: string | undefined
    let flowiseSessionId: string | undefined
    
    try {
      // Choose chatflow by model (force explicit IDs for all models)
      const chatflowIdOverride = selectedModel === 'plus'
        ? (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2
          || process.env.FLOWISE_CHATFLOW_ID_ALUDAA2
          || (process.env as any).ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDA2)
        : selectedModel === 'free'
        ? (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_FREE || process.env.FLOWISE_CHATFLOW_ID_FREE || '286c3991-be03-47f3-aa47-56a6b65c5d00')
        : selectedModel === 'aluda_test'
        ? (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_TEST || process.env.FLOWISE_CHATFLOW_ID_TEST || '286c3991-be03-47f3-aa47-56a6b65c5d00')
        : (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID || process.env.FLOWISE_CHATFLOW_ID)
      // Flowise often ignores image-only requests if the 'question' is empty.
      // Provide a concise default in ka-GE when an image is sent without text for both models.
      const effectiveMessage = (uploadedFile && (!message || message.trim().length === 0))
        ? (selectedModel === 'plus' 
            ? 'გაანალიზე ეს სურათი და განმიმარტე ქართულად რა არის მასზე ნაჩვენები.'
            : selectedModel === 'free'
            ? 'გაანალიზე ეს სურათი და განმიმარტე ქართულად რა არის მასზე ნაჩვენები.'
            : '')
        : (message || '')
      usedOverride = chatflowIdOverride
      console.log('Flowise selection:', {
        selectedModel,
        chatflowIdOverride,
        envMini: process.env.ALUDAAI_FLOWISE_CHATFLOW_ID || process.env.FLOWISE_CHATFLOW_ID,
        envA2: process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2 || process.env.FLOWISE_CHATFLOW_ID_ALUDAA2 || (process.env as any).ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDA2,
        testModel: process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_FREE || process.env.FLOWISE_CHATFLOW_ID_FREE || '286c3991-be03-47f3-aa47-56a6b65c5d00',
      })

      // If Plus chosen but no override configured, fail early instead of silently falling back
      if (selectedModel === 'plus' && !chatflowIdOverride) {
        return NextResponse.json({
          error: 'Aluda Plus disabled: set ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2 in Vercel envs',
          debug: {
            selectedModel,
            envA2: process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2 || process.env.FLOWISE_CHATFLOW_ID_ALUDAA2 || (process.env as any).ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDA2 || null,
          }
        }, { status: 500 })
      }
      
      // OPTIMIZATION: Create a stable session ID for Flowise conversation continuity
      // IMPORTANT: Use the chatId directly as sessionId for Flowise memory to work
      // For image uploads, add a timestamp to ensure unique session IDs to avoid cached failed responses
      if (chatId) {
        flowiseSessionId = uploadedFile ? `${chatId}_${Date.now()}` : chatId
      } else {
        flowiseSessionId = `${actor.type}_${actor.id}_${selectedModel}_${Date.now()}`
      }
      
      console.log('Chat API: Using Flowise sessionId:', flowiseSessionId)
      
      // Convert history to Flowise format
      const flowiseHistory = historyFromRequest.map((msg: any) => ({
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content || ''
      })).slice(-10) // Keep only last 10 messages for performance
      
      console.log('Chat API: Sending history to Flowise:', flowiseHistory.length, 'messages')
      
      flowiseResponse = await sendToFlowiseWithRetry({
        message: effectiveMessage,
        history: flowiseHistory,
        sessionId: flowiseSessionId,
        chatflowIdOverride,
        file: uploadedFile && (selectedModel === 'plus' || selectedModel === 'free') ? uploadedFile : undefined,
      })
    } catch (error: any) {
      console.error("Flowise API error:", error)
      console.error("Flowise context:", { hasFile: Boolean(uploadedFile), contentType, selectedModel })
      const hint = error?.message || 'Unknown error'
      // Clean the error hint as well
      const cleanedHint = cleanAIResponse(hint?.slice(0, 200) || '');
      
      // Provide more specific error messages for image uploads
      let errorMessage = `ბოდიში, ამ მომენტში ვერ შეგიძლიათ მიმართოთ. 💡 ${cleanedHint}`
      
      if (uploadedFile && hint.includes('SSE with no parsable data')) {
        errorMessage = 'ბოდიში, სურათის დამუშავება ვერ მოხერხდა. გთხოვთ სცადოთ ხელახლა ან სხვა სურათი ატვირთოთ.'
      } else if (uploadedFile && hint.includes('timeout')) {
        errorMessage = 'სურათის დამუშავება ძალიან დიდხანს გრძელდება. გთხოვთ სცადოთ ხელახლა.'
      } else if (uploadedFile) {
        errorMessage = 'სურათის ანალიზი ვერ მოხერხდა. გთხოვთ სცადოთ ხელახლა.'
      }
      
      flowiseResponse = {
        text: errorMessage
      }
    }

    // Log telemetry
    const duration = Date.now() - startTime
    console.log("Telemetry:", {
      timestamp: new Date().toISOString(),
      sessionId: currentChatId,
      chatId: currentChatId,
      duration,
      status: "success"
    })

    // Estimate assistant tokens as well
    const assistantTokens = Math.ceil((flowiseResponse.text?.length || 0) / 4) * tokenMultiplier
    // Only skip usage for internal test model
    if (selectedModel !== 'aluda_test') {
      await addUsage(actor, estimatedTokens + assistantTokens)
    }

    // Try to suggest a concise chat title via Flowise (best-effort, first message only)
    let aiTitle: string | undefined = undefined
    try {
      const isFirstUserMessage = (historyFromRequest?.length || 0) === 0 && Boolean(message?.trim())
      if (isFirstUserMessage && flowiseSessionId) {
        const titleResult = await Promise.race<Promise<string | null> | Promise<null>>([
          suggestTitleWithAI({
            question: message,
            sessionId: flowiseSessionId,
            chatflowIdOverride: undefined,
          }).catch(() => null),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 1800)),
        ])
        if (titleResult && titleResult.trim()) {
          aiTitle = titleResult.trim()
        }
      }
    } catch {}

    // Clean the AI response to remove unwanted characters
    const cleanedText = cleanAIResponse(flowiseResponse.text);
    
    return NextResponse.json({
      text: cleanedText,
      sources: flowiseResponse.sources,
      chatId: currentChatId,
      aiTitle,
      __meta: { ...(flowiseResponse.__meta || {}), selectedModel, usedOverride: usedOverride || null },
      debug: {
        file: Boolean(uploadedFile),
        contentType,
        endpoint: (flowiseResponse as any)?.__meta?.endpoint || null,
      }
    })

  } catch (error: any) {
    console.error("Chat API error:", error)
    const message = error?.message || 'Server error'
    const status = error?.status || 500
    // Clean error messages as well
    const cleanedError = cleanAIResponse(message)
    const payload: any = { error: cleanedError }
    if (error?.retryAfter) payload.retryAfter = error.retryAfter
    return NextResponse.json(payload, { status })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
