import { NextRequest, NextResponse } from "next/server"
import { sendToFlowiseWithRetry, suggestTitleWithFlowise } from "@/lib/flowise"
import { rateLimit } from "@/lib/rateLimit"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getOrCreateSession } from "@/lib/session"
import { addUsage, canConsume } from "@/lib/tokens"
import { prisma } from "@/lib/prisma"
// import { suggestTitleWithGroq } from "@/lib/groq"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Basic rate limit by IP
    await rateLimit({ key: `chat_${request.ip || 'unknown'}`, windowMs: 10_000, max: 30 })
    const contentType = request.headers.get('content-type') || ''
    let message: string = ''
    let chatId: string | undefined
    let model: string | undefined
    let uploadedFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      // Support both our field names and Flowise chatbot-style 'question'
      message = String(form.get('message') || form.get('question') || '')
      chatId = form.get('chatId') ? String(form.get('chatId')) : undefined
      model = form.get('model') ? String(form.get('model')) : undefined
      // Flowise expects 'files' for prediction multipart, but support multiple common aliases
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

    // Model handling: 'mini' (default) or 'aluda2'
    const selectedModel = (model === 'aluda2') ? 'aluda2' : 'mini'
    // Premium users default to aluda2 without extra token multiplier
    const isPremium = actor.type === 'user' && actor.plan === 'PREMIUM'
    const tokenMultiplier = selectedModel === 'aluda2' && !isPremium && actor.type !== 'guest' ? 5 : 1
    // Guests cannot use aluda2
    if (actor.type === 'guest' && selectedModel === 'aluda2') {
      return NextResponse.json({ error: 'გაიარეთ ავტორიზაცია Aluda 2.0-ისთვის', redirect: '/auth/signin' }, { status: 402 })
    }

    // Rough token estimate (chars/4)
    const estimatedTokens = Math.ceil((message?.length || 0) / 4) * tokenMultiplier
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

    // Generate a simple chat ID if none provided
    const currentChatId = chatId || `chat_${Date.now()}`

    // Check if client wants streaming
    const acceptHeader = request.headers.get('accept') || ''
    const wantsStreaming = acceptHeader.includes('text/event-stream') || request.headers.get('x-streaming') === 'true'

    if (wantsStreaming) {
      // Return streaming response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Choose chatflow by model
            const chatflowIdOverride = selectedModel === 'aluda2'
              ? (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2
                || process.env.FLOWISE_CHATFLOW_ID_ALUDAA2
                || (process.env as any).ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDA2)
              : (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID || process.env.FLOWISE_CHATFLOW_ID)

            const effectiveMessage = (uploadedFile && (!message || message.trim().length === 0))
              ? (selectedModel === 'aluda2' 
                  ? 'გაანალიზე ეს სურათი და განმიმარტე ქართულად რა არის მასზე ნაჩვენები.'
                  : '')
              : (message || '')

            // Get Flowise host and API key
            const flowiseHost = process.env.ALUDAAI_FLOWISE_HOST || process.env.FLOWISE_HOST
            const apiKey = process.env.ALUDAAI_FLOWISE_API_KEY || process.env.FLOWISE_API_KEY
            
            if (!flowiseHost || !chatflowIdOverride) {
              throw new Error('Flowise configuration missing')
            }

            const hostWithProtocol = /^(http|https):\/\//i.test(flowiseHost) ? flowiseHost : `https://${flowiseHost}`
            const normalizedHost = hostWithProtocol.replace(/\/+$/, '')
            
            // Use the same endpoint as non-streaming version
            const predictionUrl = `${normalizedHost}/api/v1/prediction/${chatflowIdOverride}`

            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              'Accept': 'text/event-stream',
            }
            if (apiKey) {
              headers['Authorization'] = `Bearer ${apiKey}`
            }

            const requestBody = {
              question: effectiveMessage,
              history: [],
              overrideConfig: {
                sessionId: currentChatId,
              },
            }

            // Send request to Flowise
            const response = await fetch(predictionUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
              throw new Error(`Flowise error: ${response.status}`)
            }

            // Stream the response
            const reader = response.body?.getReader()
            if (!reader) {
              throw new Error('No response body')
            }

            let fullText = ''
            let assistantTokens = 0

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = new TextDecoder().decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data:')) {
                  const data = line.slice(5).trim()
                  if (data === '[DONE]') {
                    // Send final token count
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'end', tokens: assistantTokens })}\n\n`))
                    return
                  }

                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.event === 'token' && parsed.data) {
                      fullText += parsed.data
                      assistantTokens += parsed.data.length
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'token', data: parsed.data })}\n\n`))
                    } else if (parsed.event === 'start') {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'start' })}\n\n`))
                    }
                  } catch (e) {
                    // Ignore parsing errors
                  }
                }
              }
            }

            // Add usage after streaming is complete
            const finalAssistantTokens = Math.ceil(fullText.length / 4) * tokenMultiplier
            await addUsage(actor, estimatedTokens + finalAssistantTokens)

          } catch (error: any) {
            console.error('Streaming error:', error)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'error', error: error.message })}\n\n`))
          } finally {
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Non-streaming response (existing logic)
    const startTime = Date.now()
    let flowiseResponse
    let usedOverride: string | undefined
    
    try {
      // Choose chatflow by model (force explicit IDs for both models)
      const chatflowIdOverride = selectedModel === 'aluda2'
        ? (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2
          || process.env.FLOWISE_CHATFLOW_ID_ALUDAA2
          || (process.env as any).ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDA2)
        : (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID || process.env.FLOWISE_CHATFLOW_ID)
      // Flowise often ignores image-only requests if the 'question' is empty.
      // Provide a concise default in ka-GE when an image is sent without text for Aluda 2.0.
      const effectiveMessage = (uploadedFile && (!message || message.trim().length === 0))
        ? (selectedModel === 'aluda2' 
            ? 'გაანალიზე ეს სურათი და განმიმარტე ქართულად რა არის მასზე ნაჩვენები.'
            : '')
        : (message || '')
      usedOverride = chatflowIdOverride
      console.log('Flowise selection:', {
        selectedModel,
        chatflowIdOverride,
        envMini: process.env.ALUDAAI_FLOWISE_CHATFLOW_ID || process.env.FLOWISE_CHATFLOW_ID,
        envA2: process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2 || process.env.FLOWISE_CHATFLOW_ID_ALUDAA2 || (process.env as any).ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDA2,
      })

      // If Aluda2 chosen but no override configured, fail early instead of silently falling back to mini
      if (selectedModel === 'aluda2' && !chatflowIdOverride) {
        return NextResponse.json({
          error: 'Aluda 2.0 disabled: set ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2 in Vercel envs',
          debug: {
            selectedModel,
            envA2: process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2 || process.env.FLOWISE_CHATFLOW_ID_ALUDAA2 || (process.env as any).ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDA2 || null,
          }
        }, { status: 500 })
      }
      flowiseResponse = await sendToFlowiseWithRetry({
        message: effectiveMessage,
        history: [],
        sessionId: currentChatId,
        chatflowIdOverride,
        file: uploadedFile && selectedModel === 'aluda2' ? uploadedFile : undefined,
      })
    } catch (error: any) {
      console.error("Flowise API error:", error)
      console.error("Flowise context:", { hasFile: Boolean(uploadedFile), contentType, selectedModel })
      const hint = error?.message || 'Unknown error'
      flowiseResponse = {
        text: `ბოდიში, ამ მომენტში ვერ შეგიძლიათ მიმართოთ. 💡 ${hint?.slice(0, 200)}`
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
    await addUsage(actor, estimatedTokens + assistantTokens)

    // Try to suggest a concise chat title via Flowise (best-effort)
    let aiTitle: string | undefined
    try {
      aiTitle = await suggestTitleWithFlowise({ question: message, sessionId: currentChatId, chatflowIdOverride: undefined }) || undefined
    } catch {}

    return NextResponse.json({
      text: flowiseResponse.text,
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
    const payload: any = { error: message }
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
