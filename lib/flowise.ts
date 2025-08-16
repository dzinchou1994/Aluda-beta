export interface FlowiseMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FlowiseRequest {
  question: string;
  history: FlowiseMessage[];
  overrideConfig: {
    sessionId: string;
  };
}

export interface FlowiseResponse {
  text: string;
  sources?: any[];
  [key: string]: any; // For any additional fields from Flowise
}

export interface FlowiseError {
  error: string;
  message: string;
  statusCode?: number;
}

/**
 * Send a message to Flowise via direct API
 */
export async function sendToFlowise({
  message,
  history,
  sessionId,
  chatflowIdOverride,
  file,
}: {
  message: string;
  history: FlowiseMessage[];
  sessionId: string;
  chatflowIdOverride?: string;
  file?: Blob | File | null;
}): Promise<FlowiseResponse> {
  // Read Flowise configuration from environment
  const flowiseHost = process.env.ALUDAAI_FLOWISE_HOST || process.env.FLOWISE_HOST;
  // Backward-compatible default for mini: allow FLOWISE_CHATFLOW_ID fallback
  const chatflowId = chatflowIdOverride || process.env.ALUDAAI_FLOWISE_CHATFLOW_ID || process.env.FLOWISE_CHATFLOW_ID;
  const apiKey = process.env.ALUDAAI_FLOWISE_API_KEY || process.env.FLOWISE_API_KEY;
  
  if (!flowiseHost || !chatflowId) {
    const missing: string[] = []
    if (!flowiseHost) missing.push('ALUDAAI_FLOWISE_HOST (or FLOWISE_HOST)')
    if (!chatflowId) missing.push(chatflowIdOverride ? 'chatflowIdOverride' : 'ALUDAAI_FLOWISE_CHATFLOW_ID or FLOWISE_CHATFLOW_ID')
    throw new Error(`Flowise configuration missing: ${missing.join(', ')}`)
  }

  // Normalize host: ensure protocol and no trailing slash
  const hostWithProtocol = /^(http|https):\/\//i.test(flowiseHost) ? flowiseHost : `https://${flowiseHost}`
  const normalizedHost = hostWithProtocol.replace(/\/+$/, '')
  const predictionUrl = `${normalizedHost}/api/v1/prediction/${chatflowId}`
  const chatbotUrl = `${normalizedHost}/api/v1/chatbot/${chatflowId}`
  
  const headers: Record<string, string> = {};

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const requestBody: FlowiseRequest = {
    question: message,
    history,
    overrideConfig: {
      sessionId,
    },
  };

  try {
    const isMultipart = Boolean(file);
    let response: Response
    let endpointUsed: 'prediction' | 'chatbot' | 'unknown' = 'unknown'
    if (isMultipart) {
      // First try EXACTLY the same shape as Flowise widget: multipart to /chatbot with 'files'
      const form = new FormData()
      form.append('question', requestBody.question || '')
      form.append('files', file as any)
      form.append('chatId', requestBody.overrideConfig?.sessionId || '')
      form.append('overrideConfig', JSON.stringify(requestBody.overrideConfig || {}))

      response = await fetch(chatbotUrl, {
        method: 'POST',
        headers: { ...headers, Accept: 'application/json' },
        body: form as any,
        signal: AbortSignal.timeout(60000),
      })
      endpointUsed = 'chatbot'

      // If chatbot multipart doesn't return JSON, fall back to prediction with base64 JSON uploads
      let ctMultipart = response.headers.get('content-type') || ''
      if (!response.ok || !ctMultipart.includes('application/json')) {
        const filename = (file as any)?.name || 'upload'
        const mime = (file as any)?.type || 'application/octet-stream'
        const arrayBuffer = await (file as any).arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const dataUrl = `data:${mime};base64,${base64}`

        const jsonBody: any = {
          question: requestBody.question || '',
          chatId: requestBody.overrideConfig?.sessionId || '',
          uploads: [ { data: dataUrl, name: filename, mime } ],
          // compatibility aliases
          files: [ { data: dataUrl, name: filename, mime } ],
          images: [ dataUrl ],
          image: dataUrl,
          overrideConfig: requestBody.overrideConfig || {},
          streaming: true,
        }

        response = await fetch(predictionUrl, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
          body: JSON.stringify(jsonBody),
          signal: AbortSignal.timeout(60000),
        })
        endpointUsed = 'prediction'
      }
    } else {
      // JSON mode: try prediction first
      response = await fetch(predictionUrl, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000),
      })
      endpointUsed = 'prediction'

      // Fallback if not OK or not JSON
      let ct = response.headers.get('content-type') || ''
      if (!response.ok || !ct.includes('application/json')) {
        const errText = await response.text().catch(() => '')
        console.warn('Prediction endpoint non-json/failed:', response.status, errText?.slice(0, 200))
        response = await fetch(chatbotUrl, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ question: requestBody.question, overrideConfig: requestBody.overrideConfig }),
          signal: AbortSignal.timeout(60000),
        })
        endpointUsed = 'chatbot'
      }
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      const errorText = await response.text();
      console.error('Flowise non-OK:', response.status, errorText?.slice(0, 400))
      let errorData: FlowiseError;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = {
          error: 'Request failed',
          message: `HTTP ${response.status}: ${errorText}`,
          statusCode: response.status,
        };
      }
      
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json();
      const text = data.text || data.response || data.answer || data.message || 'No response received';
      return {
        text,
        sources: data.sources || data.documents || [],
        ...data,
        __meta: { chatflowId, host: normalizedHost, endpoint: endpointUsed },
      };
    }
    if (contentType.includes('text/event-stream')) {
      const raw = await response.text().catch(() => '')
      const lines = raw.split(/\n+/).map(l => l.trim()).filter(l => l.startsWith('data:') && l.length > 5)
      let lastPayload: any = null
      const pieces: string[] = []
      for (const l of lines) {
        const jsonPart = l.replace(/^data:\s*/, '')
        try {
          const p = JSON.parse(jsonPart)
          lastPayload = p
          const token = typeof p === 'string' ? p
            : p.text || p.message || p.answer || p.content
            || (p.data && (p.data.text || p.data.message || p.data.answer || p.data.content))
            || (Array.isArray(p.choices) ? p.choices.map((c: any) => c?.delta?.content || c?.message?.content || '').join('') : '')
          if (token) pieces.push(String(token))
        } catch {}
      }
      const combined = pieces.join('').trim()
      if (combined.length > 0) {
        return { text: combined, sources: lastPayload?.sources || lastPayload?.documents || [], ...lastPayload, __meta: { chatflowId, host: normalizedHost, endpoint: endpointUsed } }
      }
      if (lastPayload) {
        const text = lastPayload.text || lastPayload.response || lastPayload.answer || lastPayload.message || 'No response received'
        return { text, sources: lastPayload.sources || lastPayload.documents || [], ...lastPayload, __meta: { chatflowId, host: normalizedHost, endpoint: endpointUsed } }
      }
      throw new Error(`SSE with no parsable data: ${raw.slice(0, 200)}`)
    }
    const nonJson = await response.text().catch(() => '')
    throw new Error(`Unexpected content-type ${contentType}: ${nonJson.slice(0, 200)}`)
    
    // Extract the text response from Flowise
    // Unreachable: return kept above per branch
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

/**
 * Retry wrapper for Flowise API calls
 */
export async function sendToFlowiseWithRetry(
  params: Parameters<typeof sendToFlowise>[0],
  maxRetries: number = 2
): Promise<FlowiseResponse> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendToFlowise(params);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Ask Flowise to suggest a very short chat title for a given question.
 * Best-effort: returns null on failure.
 */
export async function suggestTitleWithFlowise({
  question,
  sessionId,
  chatflowIdOverride,
}: {
  question: string
  sessionId: string
  chatflowIdOverride?: string
}): Promise<string | null> {
  try {
    const prompt = [
      'You are a title generator. Generate a very short, human-friendly topic title based on the following user question.',
      'Return ONLY the title. No quotes. No extra words. Prefer 1-4 words like a folder name.',
      `Question: ${question}`,
    ].join('\n')

    const res = await sendToFlowiseWithRetry({
      message: prompt,
      history: [],
      sessionId: `${sessionId}_title`,
      chatflowIdOverride,
    })

    const raw = (res.text || '').trim()
    if (!raw) return null
    // remove surrounding quotes if any
    const cleaned = raw.replace(/^"|"$/g, '')
    return cleaned
  } catch {
    return null
  }
}
