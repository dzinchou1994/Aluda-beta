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

    // Model handling: 'mini' (default), 'aluda2', or 'test'
    const selectedModel = (model === 'aluda2') ? 'aluda2' : (model === 'test') ? 'test' : 'mini'
    // Premium users default to aluda2 without extra token multiplier
    const isPremium = actor.type === 'user' && actor.plan === 'PREMIUM'
    // Test model is free and unlimited for everyone
    const tokenMultiplier = selectedModel === 'test' ? 0 : (selectedModel === 'aluda2' && !isPremium && actor.type !== 'guest' ? 5 : 1)
    // Guests cannot use aluda2, but can use test model
    if (actor.type === 'guest' && selectedModel === 'aluda2') {
      return NextResponse.json({ error: 'გაიარეთ ავტორიზაცია Aluda 2.0-ისთვის', redirect: '/auth/signin' }, { status: 402 })
    }
    // Enforce premium for Aluda 2.0: non-premium logged-in users must upgrade
    if (actor.type === 'user' && selectedModel === 'aluda2' && !isPremium) {
      return NextResponse.json({ error: 'Aluda 2.0 ხელმისაწვდომია მხოლოდ PREMIUM მომხმარებლებისთვის', redirect: '/buy' }, { status: 402 })
    }

    // For test model, skip token consumption check
    let estimatedTokens = 0
    if (selectedModel !== 'test') {
      // Rough token estimate (chars/4)
      estimatedTokens = Math.ceil((message?.length || 0) / 4) * tokenMultiplier
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
      
      // For now, return non-streaming response since Flowise doesn't support streaming
      // We'll implement proper streaming later
      console.log('Flowise doesn\'t support streaming, falling back to non-streaming');
      
      // Fall through to non-streaming logic
    }

    // Non-streaming response (existing logic)
    const startTime = Date.now()
    let flowiseResponse
    let usedOverride: string | undefined
    let flowiseSessionId: string | undefined
    
    try {
      // Choose chatflow by model (force explicit IDs for all models)
      const chatflowIdOverride = selectedModel === 'aluda2'
        ? (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2
          || process.env.FLOWISE_CHATFLOW_ID_ALUDAA2
          || (process.env as any).ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDA2)
        : selectedModel === 'test'
        ? '286c3991-be03-47f3-aa47-56a6b65c5d00' // Test model chatflow ID
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
        testModel: '286c3991-be03-47f3-aa47-56a6b65c5d00',
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
      
      // OPTIMIZATION: Create a stable session ID for Flowise conversation continuity
      // IMPORTANT: Use the chatId directly as sessionId for Flowise memory to work
      if (chatId) {
        flowiseSessionId = chatId // Use chatId directly for consistent session tracking
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
        file: uploadedFile && selectedModel === 'aluda2' ? uploadedFile : undefined,
      })
    } catch (error: any) {
      console.error("Flowise API error:", error)
      console.error("Flowise context:", { hasFile: Boolean(uploadedFile), contentType, selectedModel })
      const hint = error?.message || 'Unknown error'
      // Clean the error hint as well
      const cleanedHint = cleanAIResponse(hint?.slice(0, 200) || '');
      flowiseResponse = {
        text: `ბოდიში, ამ მომენტში ვერ შეგიძლიათ მიმართოთ. 💡 ${cleanedHint}`
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
    // Only track token usage for non-test models
    if (selectedModel !== 'test') {
      await addUsage(actor, estimatedTokens + assistantTokens)
    }

    // Try to suggest a concise chat title via Flowise (best-effort, first message only)
    let aiTitle: string | undefined = undefined
    try {
      const isFirstUserMessage = (historyFromRequest?.length || 0) === 0 && Boolean(message?.trim())
      if (isFirstUserMessage && flowiseSessionId) {
        const titleResult = await Promise.race<Promise<string | null> | Promise<null>>([
          suggestTitleWithFlowise({
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
