import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return list.includes(email.toLowerCase())
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email || null
  const isAdmin = isAdminEmail(email)
  return { isAdmin, email, session }
}


