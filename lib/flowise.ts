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

/**
 * Send a message to AI service via direct API
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
  // Backward-compatible default for test: allow FLOWISE_CHATFLOW_ID fallback
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
  const internalPredictionUrl = `${normalizedHost}/api/v1/internal-prediction/${chatflowId}`
  const chatbotUrl = `${normalizedHost}/api/v1/chatbot/${chatflowId}`
  // Flowise UI uses this endpoint for chat with files
  const chatflowChatUrl = `${normalizedHost}/api/v1/chatflows/${chatflowId}/chat`
  
  const headers: Record<string, string> = {
    // Performance optimization: keep connection alive (but use valid format)
    'Connection': 'keep-alive',
    // Accept both streaming and JSON for better compatibility
    'Accept': 'text/event-stream, application/json, */*',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    // Some Flowise setups expect x-api-key instead of Authorization
    headers['x-api-key'] = apiKey;
  }

  // Optimize: reduce timeout for faster failure detection
  const timeoutMs = 30000; // Reduced from 60000 to 30000

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
      let endpointUsed: 'prediction' | 'chatbot' | 'chatflow' | 'unknown' = 'unknown'
    const isImageMissingText = (t: string) => {
      const s = (t || '').toLowerCase()
      return (
        /no\s+image/.test(s) || /image\s+not\s+received/.test(s) || /no\s+file/.test(s)
        || (/სურათ/i.test(s) && (/არ/i.test(s) || /ვერ/i.test(s) || /ვერა/i.test(s)))
        || /მხოლოდ\s+ტექსტ/i.test(s)
      )
    }
    // Debug: log header presence without exposing secrets
    try {
      console.log('Flowise request debug:', {
        hasApiKey: Boolean(apiKey),
        hasAuthHeader: Boolean(headers['Authorization']),
        hasXApiKeyHeader: Boolean(headers['x-api-key']),
        host: normalizedHost,
        chatflowId,
        isMultipart: Boolean(file),
      })
    } catch {}

    if (isMultipart) {
      // Try multiple approaches for image uploads
      const arrayBuffer = await (file as any).arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mime = (file as any)?.type || 'application/octet-stream'
      const dataUrl = `data:${mime};base64,${base64}`
      const fname = (file as any)?.name || 'upload.jpg'
      
      // Try internal-prediction endpoint first (most reliable for image uploads)
      const internalBody = {
        question: requestBody.question || '',
        chatId: requestBody.overrideConfig?.sessionId || '',
        uploads: [{ data: dataUrl, name: fname, mime, type: 'file' }],
        overrideConfig: requestBody.overrideConfig || {},
      }

      try {
        console.log('Trying internal-prediction endpoint for image upload:', {
          url: internalPredictionUrl,
          hasApiKey: Boolean(apiKey),
          bodySize: JSON.stringify(internalBody).length
        })
        
        response = await fetch(internalPredictionUrl, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(internalBody),
          signal: AbortSignal.timeout(timeoutMs),
        })
        endpointUsed = 'prediction'
        
        console.log('Internal-prediction response:', {
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type')
        })
        
        // If internal-prediction fails, try chatflow chat endpoint
        if (!response.ok) {
          const chatflowBody = {
            question: requestBody.question || '',
            chatId: requestBody.overrideConfig?.sessionId || '',
            uploads: [{ data: dataUrl, name: fname, mime, type: 'file' }],
            overrideConfig: requestBody.overrideConfig || {},
          }
          
          response = await fetch(chatflowChatUrl, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(chatflowBody),
            signal: AbortSignal.timeout(timeoutMs),
          })
          endpointUsed = 'chatflow'
        }
        
        // If both fail, try chatbot endpoint
        if (!response.ok) {
          const chatbotBody = {
            question: requestBody.question || '',
            chatId: requestBody.overrideConfig?.sessionId || '',
            uploads: [{ data: dataUrl, name: fname, mime, type: 'file' }],
            overrideConfig: requestBody.overrideConfig || {},
          }
          
          response = await fetch(chatbotUrl, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(chatbotBody),
            signal: AbortSignal.timeout(timeoutMs),
          })
          endpointUsed = 'chatbot'
        }
        
        // Final fallback: prediction endpoint
        if (!response.ok) {
          const predictionBody = {
            question: requestBody.question || '',
            chatId: requestBody.overrideConfig?.sessionId || '',
            uploads: [{ data: dataUrl, name: fname, mime, type: 'file' }],
            overrideConfig: requestBody.overrideConfig || {},
          }
          
          response = await fetch(predictionUrl, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(predictionBody),
            signal: AbortSignal.timeout(timeoutMs),
          })
          endpointUsed = 'prediction'
        }
      } catch (error) {
        // Fallback to prediction endpoint
        const predictionBody = {
          question: requestBody.question || '',
          chatId: requestBody.overrideConfig?.sessionId || '',
          uploads: [{ data: dataUrl, name: fname, mime, type: 'file' }],
          overrideConfig: requestBody.overrideConfig || {},
        }
        
        response = await fetch(predictionUrl, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(predictionBody),
          signal: AbortSignal.timeout(timeoutMs),
        })
        endpointUsed = 'prediction'
      }
    } else {
      // JSON mode: use prediction endpoint directly since internal-prediction requires auth
      response = await fetch(predictionUrl, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(timeoutMs),
      })
      endpointUsed = 'prediction'
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
      // Try hard to extract text from many Flowise/provider shapes
      const nested = (path: string[]): any => path.reduce((acc, key) => (acc && typeof acc === 'object') ? acc[key] : undefined, data)
      const choicesJoined = Array.isArray(data?.choices)
        ? data.choices.map((c: any) => c?.delta?.content || c?.message?.content || c?.text || '').join('')
        : ''
      let text = (
        data.text || data.response || data.answer || data.message ||
        nested(['data','text']) || nested(['data','message']) || nested(['data','answer']) || nested(['data','content']) ||
        nested(['response','text']) || nested(['response','message']) || nested(['response','answer']) ||
        choicesJoined ||
        ''
      ) || ''

      // Clean the AI response to remove unwanted characters
      text = cleanAIResponse(text);

      // If still empty, deep-scan common providers (LangChain/OpenAI/LLM) structures
      if (!text || String(text).trim().length === 0) {
        const isStringCandidate = (s: any) => typeof s === 'string' && s.trim().length > 0 && !/^data:[^;]+;base64,/i.test(s)
        const preferredKeys = new Set(['text','message','content','answer','response','output_text','result'])
        const scan = (node: any): string | null => {
          if (!node) return null
          if (Array.isArray(node)) {
            for (const item of node) {
              const found = scan(item)
              if (found) return found
            }
            return null
          }
          if (typeof node === 'object') {
            // Prefer specific keys first
            for (const key of Object.keys(node)) {
              if (preferredKeys.has(key) && isStringCandidate((node as any)[key])) return (node as any)[key]
            }
            // Then traverse typical containers
            const containers = ['data','response','output','outputs','messages','message','choices','result']
            for (const key of containers) {
              if (key in node) {
                const found = scan((node as any)[key])
                if (found) return found
              }
            }
            // Finally traverse everything
            for (const key of Object.keys(node)) {
              const val = (node as any)[key]
              if (isStringCandidate(val)) return val
              const found = scan(val)
              if (found) return found
            }
          }
          return null
        }
        const deep = scan(data)
        if (deep) text = deep
        else {
          console.warn('Flowise JSON contained no obvious text. Keys:', Object.keys(data || {}).slice(0, 20))
        }
      }

      if (!text || String(text).trim().length === 0) text = 'No response received'

      // If JSON to prediction produced a "missing image" style reply, it means the image wasn't processed correctly
      if (isMultipart && endpointUsed === 'prediction' && isImageMissingText(text)) {
        console.warn('Flowise reported missing image despite JSON uploads array. This may indicate a configuration issue.')
      }

      return {
        text,
        sources: data.sources || data.documents || nested(['data','sources']) || nested(['data','documents']) || [],
        ...data,
        __meta: { chatflowId, host: normalizedHost, endpoint: endpointUsed, debug: `Used ${endpointUsed} endpoint with JSON uploads array` },
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
            : (p.event === 'token' && typeof p.data === 'string') ? p.data
            : p.text || p.message || p.answer || p.content
            || (p.data && (typeof p.data === 'string' ? p.data : (p.data.text || p.data.message || p.data.answer || p.data.content)))
            || (Array.isArray(p.choices) ? p.choices.map((c: any) => c?.delta?.content || c?.message?.content || '').join('') : '')
          if (token) pieces.push(String(token))
        } catch {}
      }
      const combined = pieces.join('').trim()
      if (combined.length > 0) {
        // Clean the combined streaming response
        const cleanedCombined = cleanAIResponse(combined);
        return { text: cleanedCombined, sources: lastPayload?.sources || lastPayload?.documents || [], ...lastPayload, __meta: { chatflowId, host: normalizedHost, endpoint: endpointUsed } }
      }
      if (lastPayload) {
        const text = lastPayload.text || lastPayload.response || lastPayload.answer || lastPayload.message || 'No response received'
        // Clean the lastPayload response
        const cleanedText = cleanAIResponse(text);
        return { text: cleanedText, sources: lastPayload.sources || lastPayload.documents || [], ...lastPayload, __meta: { chatflowId, host: normalizedHost, endpoint: endpointUsed } }
      }
      
      // If SSE parsing failed, try to fall back to JSON parsing of the raw response
      if (raw.trim()) {
        try {
          const jsonData = JSON.parse(raw)
          const text = jsonData.text || jsonData.response || jsonData.answer || jsonData.message || ''
          if (text && String(text).trim().length > 0) {
            const cleanedText = cleanAIResponse(text);
            return { text: cleanedText, sources: jsonData.sources || jsonData.documents || [], ...jsonData, __meta: { chatflowId, host: normalizedHost, endpoint: endpointUsed } }
          }
        } catch {}
      }
      
      // If all parsing attempts failed, return a more helpful error message
      console.warn('Flowise SSE parsing failed:', { raw: raw.slice(0, 200), contentType, endpointUsed })
      throw new Error(`Flowise returned empty or unparseable response. Please try again.`)
    }
    // Generic fallback: attempt to parse the body as text, try JSON, then try SSE-like lines, finally return raw text
    const rawFallback = await response.text().catch(() => '')
    if (rawFallback) {
      try {
        const asJson = JSON.parse(rawFallback)
        const txt = asJson?.text || asJson?.response || asJson?.answer || asJson?.message || ''
        if (txt && String(txt).trim().length > 0) {
          // Clean the JSON fallback response
          const cleanedTxt = cleanAIResponse(txt);
          return { text: cleanedTxt, sources: asJson?.sources || asJson?.documents || [], ...asJson, __meta: { chatflowId, host: normalizedHost, endpoint: endpointUsed } }
        }
      } catch {}
      // Try SSE-like parse even if header not marked as event-stream
      const lines = rawFallback.split(/\n+/).map(l => l.trim()).filter(l => l.startsWith('data:') && l.length > 5)
      if (lines.length > 0) {
        const tokens: string[] = []
        let lastPayload: any = null
        for (const l of lines) {
          const jsonPart = l.replace(/^data:\s*/, '')
          try {
            const p = JSON.parse(jsonPart)
            lastPayload = p
            const token = typeof p === 'string' ? p
              : p.text || p.message || p.answer || p.content
              || (p.data && (p.data.text || p.data.message || p.data.answer || p.data.content))
              || (Array.isArray(p.choices) ? p.choices.map((c: any) => c?.delta?.content || c?.message?.content || '').join('') : '')
            if (token) tokens.push(String(token))
          } catch {}
        }
        const combined = tokens.join('').trim()
        if (combined.length > 0) {
          // Clean the combined fallback response
          const cleanedCombined = cleanAIResponse(combined);
          return { text: cleanedCombined, sources: lastPayload?.sources || lastPayload?.documents || [], ...lastPayload, __meta: { chatflowId, host: normalizedHost, endpoint: endpointUsed } }
        }
      }
      // If still nothing useful, return raw snippet instead of throwing so UI shows something
      const isHtmlError = /<(!DOCTYPE|html)[^>]*>/i.test(rawFallback)
      const safeMsgKa = 'ბოდიში, სერვერმა დროებით შეცდომა დააბრუნა (მაგ. 502). გთხოვთ სცადოთ ხელახლა რამდენიმე წამში.'
      const text = isHtmlError ? safeMsgKa : (rawFallback.slice(0, 400) || 'No response received')
      return { text, __meta: { chatflowId, host: normalizedHost, endpoint: endpointUsed } as any } as any
    }
    throw new Error(`Unexpected content-type ${contentType} with empty body`)
    
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
 * Retry wrapper for Flowise API calls - OPTIMIZED for speed
 */
export async function sendToFlowiseWithRetry(
  params: Parameters<typeof sendToFlowise>[0],
  maxRetries: number = 1  // Reduced from 2 to 1 for faster response
): Promise<FlowiseResponse> {
  let lastError: Error;
  
  // OPTIMIZATION: For test model, use faster retry settings
  const isTestModel = params.chatflowIdOverride === (process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_TEST || process.env.FLOWISE_CHATFLOW_ID_TEST || '286c3991-be03-47f3-aa47-56a6b65c5d00')
  const effectiveMaxRetries = isTestModel ? 0 : maxRetries // No retries for test model
  
  for (let attempt = 1; attempt <= effectiveMaxRetries + 1; attempt++) {
    try {
      return await sendToFlowise(params);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt > effectiveMaxRetries) {
        break;
      }
      
      // Reduced delay for faster retry
      const delay = Math.min(500 * Math.pow(2, attempt - 1), 2000); // Reduced from 1000-5000 to 500-2000
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Ask AI to suggest a very short chat title for a given question.
 * Best-effort: returns null on failure.
 */
export async function suggestTitleWithAI({
  question,
  sessionId,
  chatflowIdOverride,
}: {
  question: string
  sessionId: string
  chatflowIdOverride?: string
}): Promise<string | null> {
  try {
    // Use the new dedicated title generation chatflow
    const titleChatflowId = chatflowIdOverride || 'e3ffe36f-ebdf-4edc-beea-79d8ab2f3914'
    
    const response = await fetch(
      "https://flowise-eden.onrender.com/api/v1/prediction/e3ffe36f-ebdf-4edc-beea-79d8ab2f3914",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: question
        })
      }
    );

    if (!response.ok) {
      console.warn('Title generation failed:', response.status, response.statusText)
      return null
    }

    const result = await response.json()
    
    // Extract text from the response
    const raw = (result.text || result.response || result.answer || result.message || '').trim()
    if (!raw) return null
    
    // If Flowise responded with a sentence that includes a quoted title, prefer the quoted text
    const quotedMatch = raw.match(/["""]([^"""]+)["""]/)
    const preferred = quotedMatch ? quotedMatch[1] : raw
    // remove surrounding quotes if any and clean
    let cleaned = preferred.replace(/^"|"$/g, '')
    cleaned = cleanAIResponse(cleaned)
    return cleaned
  } catch (error) {
    console.warn('Title generation error:', error)
    return null
  }
}
