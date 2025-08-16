type StoreEntry = {
  count: number
  expiresAt: number
}

const memoryStore: Map<string, StoreEntry> = new Map()

export async function rateLimit({ key, windowMs, max }: { key: string; windowMs: number; max: number }) {
  const now = Date.now()
  const entry = memoryStore.get(key)
  if (!entry || entry.expiresAt < now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs })
    return
  }
  if (entry.count >= max) {
    const retryAfter = Math.max(0, Math.ceil((entry.expiresAt - now) / 1000))
    const err: any = new Error('Too many requests')
    err.status = 429
    err.retryAfter = retryAfter
    throw err
  }
  entry.count += 1
  memoryStore.set(key, entry)
}


