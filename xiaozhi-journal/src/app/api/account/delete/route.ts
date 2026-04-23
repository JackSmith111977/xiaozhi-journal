import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * DELETE /api/account/delete
 *
 * Deletes the authenticated user's auth.users record via Supabase Admin API.
 * Must be called AFTER deleting the profile (cascade handles child tables).
 *
 * Security: Only uses SUPABASE_SERVICE_ROLE_KEY on the server side.
 * The caller must have a valid Supabase session.
 */
export async function DELETE() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: '服务端配置缺失，请联系管理员' },
      { status: 500 }
    )
  }

  // Verify the caller has a valid session via cookie
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Route handlers can set cookies, but not needed for auth check
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: '未登录，无法删除账户' },
      { status: 401 }
    )
  }

  // Create admin client with service role
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  // Delete the auth user (this also cascades to profile and all child tables)
  const { error } = await adminClient.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json(
      { error: `删除账户失败：${error.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
