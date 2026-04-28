import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createJsonResponseWithCookies } from '@/lib/middleware/withAuth'

/**
 * POST /api/sync
 *
 * Synchronizes pending local IndexedDB journals to Supabase cloud.
 * Actual sync logic will be implemented in Epic 9.
 */
export async function POST(request: NextRequest) {
  const { user, response: authResponse } = await withAuth(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  // TODO: Epic 9 — implement offline sync:
  // 1. Read pending journals from IndexedDB (client-side)
  // 2. Batch write to Supabase journals table
  // 3. Mark synced in IndexedDB
  // 4. Return sync result

  return createJsonResponseWithCookies(
    {
      message: '同步功能开发中',
      synced: 0,
    },
    { status: 200 },
    authResponse
  )
}
