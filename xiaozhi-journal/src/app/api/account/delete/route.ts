import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createJsonResponseWithCookies } from '@/lib/middleware/withAuth'

/**
 * DELETE /api/account/delete
 *
 * Deletes the authenticated user's auth.users record via Supabase Admin API.
 * Must be called AFTER deleting the profile (cascade handles child tables).
 *
 * Security: Only uses SUPABASE_SERVICE_ROLE_KEY on the server side.
 * The caller must have a valid Supabase session.
 */
export async function DELETE(request: NextRequest) {
  const { user, response: authResponse } = await withAuth(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: '服务端配置缺失，请联系管理员' },
      { status: 500 }
    )
  }

  const cookieStore = await cookies()

  // Create admin client with service role (separate from withAuth client)
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

  return createJsonResponseWithCookies(
    { success: true },
    { status: 200 },
    authResponse
  )
}
