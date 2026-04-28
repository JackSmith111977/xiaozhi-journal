import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Paths accessible without authentication (pages)
const publicPaths = ['/auth/login', '/auth/callback', '/auth/reset']

// Static file extensions (more specific than includes('.'))
const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json', '.xml', '.txt', '.html', '.map']

/**
 * Proxy (formerly middleware) for page route auth checks.
 *
 * Note: Per Next.js 16 docs, proxy should NOT be used as a full session management
 * solution. API route authentication is handled by withAuth in route handlers.
 * Proxy only handles page route redirects.
 *
 * Runtime: nodejs (NOT edge) - Next.js 16 proxy default.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public pages, static files, and assets
  if (
    publicPaths.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    staticExtensions.some(ext => pathname.endsWith(ext))
  ) {
    return NextResponse.next()
  }

  // API routes — pass through to route handlers (withAuth handles auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Page routes — redirect to login if not authenticated
  const response = NextResponse.next()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Missing config — redirect to login (can't verify session)
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          // Apply cache-control headers from Supabase SSR
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              response.headers.set(key, value)
            )
          }
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
