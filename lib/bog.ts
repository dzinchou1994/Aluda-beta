import { prisma } from '@/lib/prisma'

export async function getBogEnvFromDb() {
  try {
    const keys = ['BOG_PUBLIC_KEY','BOG_SECRET_KEY','BOG_API_BASE','BOG_RETURN_URL','BOG_CALLBACK_URL']
    const rows = await (prisma as any).setting.findMany({ where: { key: { in: keys } } })
    const map = Object.fromEntries((rows as any[]).map((r: any) => [r.key, r.value])) as Record<string, string | undefined>
    const base = (map.BOG_API_BASE || 'https://api.bog.ge').replace(/\/$/, '')
    return {
      BOG_PUBLIC_KEY: map.BOG_PUBLIC_KEY,
      BOG_SECRET_KEY: map.BOG_SECRET_KEY,
      BOG_API_BASE: base,
      BOG_RETURN_URL: map.BOG_RETURN_URL,
      BOG_CALLBACK_URL: map.BOG_CALLBACK_URL,
    }
  } catch {
    return { BOG_PUBLIC_KEY: undefined, BOG_SECRET_KEY: undefined, BOG_API_BASE: undefined, BOG_RETURN_URL: undefined, BOG_CALLBACK_URL: undefined }
  }
}

export function getBogEnv() {
  const {
    BOG_PUBLIC_KEY,
    BOG_SECRET_KEY,
    BOG_API_BASE = 'https://api.bog.ge',
    BOG_RETURN_URL,
    BOG_CALLBACK_URL,
  } = process.env as Record<string, string | undefined>

  const missing: string[] = []
  if (!BOG_PUBLIC_KEY) missing.push('BOG_PUBLIC_KEY')
  if (!BOG_SECRET_KEY) missing.push('BOG_SECRET_KEY')
  if (!BOG_RETURN_URL) missing.push('BOG_RETURN_URL')
  if (!BOG_CALLBACK_URL) missing.push('BOG_CALLBACK_URL')
  if (missing.length) throw new Error(`Missing BOG env vars: ${missing.join(', ')}`)

  const base = BOG_API_BASE.replace(/\/$/, '')
  return {
    BOG_PUBLIC_KEY,
    BOG_SECRET_KEY,
    BOG_API_BASE: base,
    BOG_RETURN_URL,
    BOG_CALLBACK_URL,
  }
}

export async function getBogAccessToken(): Promise<string> {
  const { BOG_PUBLIC_KEY, BOG_SECRET_KEY } = getBogEnv()
  
  const auth = Buffer.from(`${BOG_PUBLIC_KEY}:${BOG_SECRET_KEY}`).toString('base64')
  
  const response = await fetch('https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`BOG OAuth failed: ${response.status} - ${text}`)
  }
  
  const data = await response.json()
  if (!data.access_token) {
    throw new Error('BOG OAuth: missing access_token in response')
  }
  
  return data.access_token
}

type CreateOrderParams = {
  amount: number
  currency: string
  orderId: string
  description?: string
  customerEmail?: string | null
}

type CreateOrderResponse = {
  redirectUrl: string
  raw: any
}

async function fetchJson(url: string, init: RequestInit) {
  const res = await fetch(url, init)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`BOG API ${res.status}: ${text || res.statusText}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res.text()
}

export async function createBogOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  // Prefer DB-backed values; fallback to process.env for local/dev
  const dbEnv = await getBogEnvFromDb()
  const hasDb = dbEnv.BOG_PUBLIC_KEY && dbEnv.BOG_SECRET_KEY && dbEnv.BOG_RETURN_URL && dbEnv.BOG_CALLBACK_URL
  const { BOG_PUBLIC_KEY, BOG_SECRET_KEY, BOG_API_BASE, BOG_RETURN_URL, BOG_CALLBACK_URL } = hasDb ? (dbEnv as any) : getBogEnv()

  // First get OAuth access token
  const accessToken = await getBogAccessToken()
  
  // Payments Manager typically uses different endpoints than iPay
  // Try common patterns - your tenant may use a different one
  const path = process.env.BOG_CREATE_ORDER_PATH || '/v1/orders'
  
  // Shape payload per Payments Manager standard flow: order create → receive paymentUrl
  // The exact field names may differ; adapt to your merchant configuration.
  const payload = {
    amount: params.amount,
    currency: params.currency || 'GEL',
    description: params.description || `Aluda Premium ${params.orderId}`,
    order_id: params.orderId,
    return_url: BOG_RETURN_URL,
    callback_url: BOG_CALLBACK_URL,
    customer: params.customerEmail ? { email: params.customerEmail } : undefined,
    // Try alternative field names that Payments Manager might expect
    orderId: params.orderId,
    returnUrl: BOG_RETURN_URL,
    callbackUrl: BOG_CALLBACK_URL,
    // Some systems expect amount as object
    amount_value: params.amount,
    amount_currency: params.currency || 'GEL',
  }
  
  // After OAuth, use the actual API base URL, not the OAuth URL
  const apiBase = 'https://api.bog.ge'
  const url = `${apiBase}${path.startsWith('/') ? path : `/${path}`}`
  
  console.log('BOG create order request:', { url, payload })
  
  const raw = await fetchJson(url, {
    method: 'POST',
    headers: {
      // Use the OAuth Bearer token as specified in docs
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  // Log the full response for debugging
  console.log('BOG create order response:', JSON.stringify(raw, null, 2))

  // Try multiple possible field names for redirect URL
  const redirectUrl = raw?.redirect_url || raw?.payment_url || raw?.url || raw?.redirectUrl || raw?.paymentUrl
  if (!redirectUrl) {
    console.error('BOG response missing redirect URL. Available fields:', Object.keys(raw || {}))
    throw new Error(`BOG create order: missing redirect URL in response. Response: ${JSON.stringify(raw)}`)
  }
  return { redirectUrl, raw }
}

export type BogCallbackPayload = {
  order_id?: string
  status?: string
  amount?: number
  currency?: string
  transaction_id?: string
  signature?: string
  [key: string]: any
}

export function verifyBogCallback(payload: BogCallbackPayload): boolean {
  // Depending on merchant setup, BOG may sign callbacks; insert verification here if applicable.
  // For now, accept and rely on server-side order query if needed.
  return Boolean(payload?.order_id)
}


