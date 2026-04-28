import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Paths accessible without authentication (pages)
const publicPaths = ['/auth/login', '/auth/callback', '/auth/reset']

// API routes that require authentication
const protectedApiPaths = [
  '/api/journal',
  '/api/ai',
  '/api/sync',
  '/api/settings',
  '/api/account',
  '/api/email',
]

// API routes accessible without authentication
const publicApiPaths = ['/api/auth']

/**
 * Proxy (formerly middleware) for optimistic auth checks.
 *
 * Note: Per Next.js 16 docs, proxy should NOT be used as a full session management
 * solution. It's for optimistic checks only. Full JWT verification happens in
 * route handlers via withAuth (using getUser(), not getSession()).
 *
 * Runtime: nodejs (NOT edge) - Next.js 16 proxy default.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static files, assets, and public pages
  if (
    publicPaths.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Public API routes — allow through
  if (publicApiPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Protected API routes — return 401 JSON if not authenticated
  if (protectedApiPaths.some(p => pathname.startsWith(p))) {
    const response = NextResponse.next()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              response.cookies.set(name, value)
            )
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    return response
  }

  // Page routes — redirect to login if not authenticated
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            response.cookies.set(name, value)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
