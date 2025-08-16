import { NextRequest, NextResponse } from "next/server"
import { sendToFlowiseWithRetry, suggestTitleWithFlowise } from "@/lib/flowise"
import { rateLimit } from "@/lib/rateLimit"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getOrCreateSession } from "@/lib/session"
import { addUsage, canConsume } from "@/lib/tokens"
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
      if (f instanceof File) {
        uploadedFile = f
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

    // Identify actor
    const session = await getServerSession(authOptions)
    const cookieSess = getOrCreateSession()
    const actor = session?.user?.id
      ? { type: 'user' as const, id: session.user.id, plan: 'USER' as const }
      : { type: 'guest' as const, id: cookieSess.guestId || cookieSess.sessionId }

    // Model handling: 'mini' (default) or 'aluda2'
    const selectedModel = (model === 'aluda2') ? 'aluda2' : 'mini'
    // Premium users default to aluda2 without extra token multiplier
    const isPremium = false // TODO: read from DB when plan is enabled
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

    // Send to Flowise
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
      const effectiveMessage = (uploadedFile && (!message || message.trim().length === 0))
        ? ''
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
          error: 'ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2 is not configured in env',
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
