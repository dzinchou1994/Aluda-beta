import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function normalizeHost(host?: string | null) {
  const h = host || ''
  if (!h) return ''
  const withProto = /^(http|https):\/\//i.test(h) ? h : `https://${h}`
  return withProto.replace(/\/+$/, '')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const model = (searchParams.get('model') || 'free').toLowerCase()

    const host = normalizeHost(process.env.ALUDAAI_FLOWISE_HOST || process.env.FLOWISE_HOST)
    const envMini = process.env.ALUDAAI_FLOWISE_CHATFLOW_ID || process.env.FLOWISE_CHATFLOW_ID || null
    const envA2 = process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2 || process.env.FLOWISE_CHATFLOW_ID_ALUDAA2 || null
    const envTest = process.env.ALUDAAI_FLOWISE_CHATFLOW_ID_TEST || process.env.FLOWISE_CHATFLOW_ID_TEST || null

    const selectedModel = model === 'plus' || model === 'aluda2' ? 'plus' : model === 'free' || model === 'test' ? 'free' : model === 'aluda_test' ? 'aluda_test' : 'free'

    const chatflowId = selectedModel === 'plus'
      ? (envA2 || '')
      : (selectedModel === 'free' || selectedModel === 'aluda_test')
      ? (envTest || '')
      : (envMini || '')

    const internalPredictionUrl = host && chatflowId ? `${host}/api/v1/internal-prediction/${chatflowId}` : null
    const predictionUrl = host && chatflowId ? `${host}/api/v1/prediction/${chatflowId}` : null

    return NextResponse.json({
      selectedModel,
      host,
      env: {
        ALUDAAI_FLOWISE_HOST: Boolean(process.env.ALUDAAI_FLOWISE_HOST),
        FLOWISE_HOST: Boolean(process.env.FLOWISE_HOST),
        ALUDAAI_FLOWISE_CHATFLOW_ID: envMini || null,
        ALUDAAI_FLOWISE_CHATFLOW_ID_ALUDAA2: envA2 || null,
        ALUDAAI_FLOWISE_CHATFLOW_ID_TEST: envTest || null,
      },
      effective: {
        chatflowId: chatflowId || null,
        internalPredictionUrl,
        predictionUrl,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


