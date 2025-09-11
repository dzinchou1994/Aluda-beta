import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  if (!isProtected) return NextResponse.next()

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.ALUDAAI_NEXTAUTH_SECRET,
  })
  const email = (token?.email as string | undefined) || null
  const allowed = isAdminEmail(email)

  // If user has admin email, optionally require secondary password if ADMIN_SECRET is set
  if (allowed) {
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret) return NextResponse.next()
    const ok = req.cookies.get('admin_ok')?.value === '1'
    if (ok || pathname.startsWith('/admin/login')) return NextResponse.next()
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Admin secondary auth required' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/api/')) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })
  }

  const url = req.nextUrl.clone()
  url.pathname = '/auth/signin'
  url.searchParams.set('callbackUrl', req.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}


