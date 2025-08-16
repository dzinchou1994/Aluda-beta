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
  const chatflowId = chatflowIdOverride || process.env.ALUDAAI_FLOWISE_CHATFLOW_ID || process.env.FLOWISE_CHATFLOW_ID;
  const apiKey = process.env.ALUDAAI_FLOWISE_API_KEY || process.env.FLOWISE_API_KEY;
  
  if (!flowiseHost || !chatflowId) {
    throw new Error('Flowise configuration missing');
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
    if (isMultipart) {
      // Flowise prediction endpoint can accept base64 JSON uploads
      const filename = (file as any)?.name || 'upload'
      const mime = (file as any)?.type || 'application/octet-stream'
      const arrayBuffer = await (file as any).arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const dataUrl = `data:${mime};base64,${base64}`

      const jsonBody: any = {
        question: requestBody.question || '',
        chatId: requestBody.overrideConfig?.sessionId || '',
        uploads: [
          {
            data: dataUrl,
            name: filename,
            mime,
          },
        ],
        overrideConfig: requestBody.overrideConfig || {},
        streaming: false,
      }

      response = await fetch(predictionUrl, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(jsonBody),
        signal: AbortSignal.timeout(30000),
      })
    } else {
      // JSON mode: try prediction first
      response = await fetch(predictionUrl, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000),
      })

      // Fallback if not OK or not JSON
      let ct = response.headers.get('content-type') || ''
      if (!response.ok || !ct.includes('application/json')) {
        const errText = await response.text().catch(() => '')
        console.warn('Prediction endpoint non-json/failed:', response.status, errText?.slice(0, 200))
        response = await fetch(chatbotUrl, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ question: requestBody.question, overrideConfig: requestBody.overrideConfig }),
          signal: AbortSignal.timeout(30000),
        })
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
    if (!contentType.includes('application/json')) {
      const nonJson = await response.text().catch(() => '')
      throw new Error(`Non-JSON response (status ${response.status}): ${nonJson.slice(0, 200)}`)
    }
    const data = await response.json();
    
    // Extract the text response from Flowise
    const text = data.text || data.response || data.answer || data.message || 'No response received';
    
    return {
      text,
      sources: data.sources || data.documents || [],
      ...data, // Include all other fields for debugging
    };
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
