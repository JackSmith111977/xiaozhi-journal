import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error('[Account Delete] SUPABASE_SERVICE_ROLE_KEY not configured');
    return NextResponse.json(
      { error: '服务端配置缺失，请联系管理员' },
      { status: 500 }
    );
  }

  // Create admin client with service role
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  // Verify the caller has a valid session
  const {
    data: { session },
  } = await adminClient.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: '未登录，无法删除账户' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // Delete the auth user (this also cascades to profile and all child tables)
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    console.error('[Account Delete] Failed to delete auth user:', error.message);
    return NextResponse.json(
      { error: `删除账户失败：${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
