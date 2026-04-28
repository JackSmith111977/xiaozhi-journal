import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
  supabase: ReturnType<typeof createServerClient>
  response: NextResponse // Contains refreshed cookies
}

/**
 * Unified API authentication middleware.
 * Uses supabase.auth.getUser() to verify JWT (NOT getSession, to avoid race conditions).
 *
 * Returns response with refreshed cookies. Route handlers should use this response
 * or merge its cookies into their own response.
 *
 * Usage in route handlers:
 *   const { user, supabase, response } = await withAuth(request)
 *   if (!user) {
 *     return NextResponse.json({ error: '请先登录' }, { status: 401 })
 *   }
 *   // Use createJsonResponseWithCookies to merge refreshed cookies
 */
export async function withAuth(request: NextRequest): Promise<AuthResult> {
  const response = NextResponse.next()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Missing config — return null user (route handler will return 401)
    // Create a dummy supabase client for type consistency
    const emptySupabase = createServerClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      { cookies: { getAll: () => [], setAll: () => {} } }
    ) as ReturnType<typeof createServerClient>
    return { user: null, supabase: emptySupabase, response }
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
          // Write refreshed cookies to response (token refresh requires this)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          // Apply cache-control headers from Supabase SSR (prevent auth response caching)
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              response.headers.set(key, value)
            )
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return { user, supabase, response }
}

/**
 * Helper to merge cookies from source response into a new JSON response.
 * Use this when route handler needs to return custom JSON but preserve cookie refresh.
 */
export function createJsonResponseWithCookies(
  data: object,
  init: ResponseInit,
  sourceResponse?: NextResponse
): NextResponse {
  const response = NextResponse.json(data, init)
  if (sourceResponse) {
    // Copy cookies with their full options (not just name/value)
    sourceResponse.cookies.getAll().forEach(cookie => {
      // cookie object has name, value, and other properties like path, expires, etc.
      // We need to pass all options, not just the cookie object itself
      response.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        expires: cookie.expires,
        maxAge: cookie.maxAge,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
      })
    })
    // Copy headers (cache-control etc.)
    sourceResponse.headers.forEach((value, name) => {
      response.headers.set(name, value)
    })
  }
  return response
}
