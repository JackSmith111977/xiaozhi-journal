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
 *   // Use response (has refreshed cookies) or merge cookies into your response
 */
export async function withAuth(request: NextRequest): Promise<AuthResult> {
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
          // Write refreshed cookies to response (token refresh requires this)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
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
    sourceResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
  }
  return response
}
