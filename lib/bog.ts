import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

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
  const path = process.env.BOG_CREATE_ORDER_PATH || '/payments/v1/ecommerce/orders'
  
  // Shape payload per BOG ecommerce API specification
  const payload = {
    callback_url: BOG_CALLBACK_URL,
    external_order_id: params.orderId,
    purchase_units: {
      currency: params.currency || 'GEL',
      total_amount: params.amount / 100, // Convert from cents to actual amount
      basket: [
        {
          quantity: 1,
          unit_price: params.amount / 100,
          product_id: 'aluda_premium_monthly'
        }
      ]
    },
    redirect_urls: {
      fail: `${BOG_RETURN_URL}?status=fail`,
      success: `${BOG_RETURN_URL}?status=success`
    }
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
      'Accept-Language': 'ka',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  // Log the full response for debugging
  console.log('BOG create order response:', JSON.stringify(raw, null, 2))

  // Try multiple possible field names for redirect URL
  // BOG returns it in _links.redirect.href
  const redirectUrl = raw?._links?.redirect?.href || raw?.redirect_url || raw?.payment_url || raw?.url || raw?.redirectUrl || raw?.paymentUrl
  if (!redirectUrl) {
    console.error('BOG response missing redirect URL. Available fields:', Object.keys(raw || {}))
    throw new Error(`BOG create order: missing redirect URL in response. Response: ${JSON.stringify(raw)}`)
  }
  return { redirectUrl, raw }
}

export type BogCallbackPayload = {
  event?: string
  zoned_request_time?: string
  body?: {
    order_id?: string
    external_order_id?: string
    industry?: string
    [key: string]: any
  }
  order_id?: string
  external_order_id?: string
  status?: string
  amount?: number
  currency?: string
  transaction_id?: string
  signature?: string
  [key: string]: any
}

// BOG Public Key from official documentation
const BOG_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4RUyAw3+CdkS3ZNILQh
zHI9Hemo+vKB9U2BSabppkKjzjjkf+0Sm76hSMiu/HFtYhqWOESryoCDJoqffY0Q
1VNt25aTxbj068QNUtnxQ7KQVLA+pG0smf+EBWlS1vBEAFbIas9d8c9b9sSEkTrr
TYQ90WIM8bGB6S/KLVoT1a7SnzabjoLc5Qf/SLDG5fu8dH8zckyeYKdRKSBJKvhx
tcBuHV4f7qsynQT+f2UYbESX/TLHwT5qFWZDHZ0YUOUIvb8n7JujVSGZO9/+ll/g
4ZIWhC1MlJgPObDwRkRd8NFOopgxMcMsDIZIoLbWKhHVq67hdbwpAq9K9WMmEhPn
PwIDAQAB
-----END PUBLIC KEY-----`

export function verifyBogCallback(payload: BogCallbackPayload, signature?: string, rawBody?: string): boolean {
  // BOG sends event: "order_payment" and body.order_id
  const hasValidEvent = payload?.event === 'order_payment'
  const hasValidOrderId = Boolean(payload?.body?.external_order_id || payload?.body?.order_id || payload?.external_order_id || payload?.order_id)
  
  console.log('BOG Callback verification:', { 
    hasValidEvent, 
    hasValidOrderId, 
    event: payload?.event, 
    orderId: payload?.body?.external_order_id || payload?.body?.order_id || payload?.external_order_id || payload?.order_id,
    hasSignature: Boolean(signature),
    hasRawBody: Boolean(rawBody),
    rawBodyLength: rawBody?.length
  })
  
  // CRITICAL SECURITY FIX: Require signature verification for all callbacks
  // No more fallback validation that could allow fake premium upgrades
  if (!signature || !rawBody) {
    console.error('BOG Callback rejected: Missing signature or raw body')
    return false
  }
  
  try {
    // BOG documentation: verify signature on raw request body before deserialization
    const verifier = crypto.createVerify('SHA256')
    verifier.update(rawBody, 'utf8')
    
    const isValidSignature = verifier.verify(BOG_PUBLIC_KEY, signature, 'base64')
    console.log('Signature verification result:', isValidSignature)
    console.log('Raw body for verification:', rawBody.substring(0, 200) + '...')
    
    // Only allow if both signature is valid AND event/order data is valid
    return hasValidEvent && hasValidOrderId && isValidSignature
  } catch (error) {
    console.error('Signature verification error:', error)
    // CRITICAL: Never fall back to basic validation - this was the security hole
    console.error('BOG Callback rejected: Signature verification failed')
    return false
  }
}


